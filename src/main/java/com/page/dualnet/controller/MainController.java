package com.page.dualnet.controller;

import com.page.dualnet.model.Account;
import com.page.dualnet.model.Post;
import com.page.dualnet.service.AccountService;
import com.page.dualnet.service.AuthService;
import com.page.dualnet.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Controller
public class MainController {

    private final AccountService accountService;
    private final PostService postService;
    private final AuthService authService;

    public MainController(AccountService accountService, PostService postService, AuthService authService) {
        this.accountService = accountService;
        this.postService = postService;
        this.authService = authService;
    }

    @GetMapping({"/", "/home"})
    public String home(Model model, HttpSession session) {
        model.addAttribute("username", session.getAttribute("username"));
        return "startingPage";
    }

    // API: register
    @PostMapping("/api/register")
    @ResponseBody
    public ResponseEntity<?> apiRegister(@RequestBody Account account, HttpSession session) {
        if (account == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "account_required"));
        }

        // Explizite Pflichtfeldprüfung: username, displayName, email, password
        List<String> missing = new ArrayList<>();
        if (account.getUsername() == null || account.getUsername().isBlank()) missing.add("username");
        if (account.getDisplayName() == null || account.getDisplayName().isBlank()) missing.add("displayName");
        if (account.getEmail() == null || account.getEmail().isBlank()) missing.add("email");
        if (account.getPassword() == null || account.getPassword().isBlank()) missing.add("password");

        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "missing_fields", "fields", missing));
        }

        // Username-Einzigartigkeit prüfen
        String username = account.getUsername();
        if (authService.findByUsername(username).isPresent() || accountService.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "username_taken"));
        }

        // persist to DB and in-memory registry so both search sources find the user
        try {
            accountService.save(account);
        } catch (Exception e) {
            // if DB save fails, still register in-memory but log
            System.err.println("Warning: account save failed: " + e.getMessage());
        }

        authService.register(account);
        session.setAttribute("username", account.getUsername());
        return ResponseEntity.ok(Map.of("status", "ok", "username", account.getUsername()));
    }

    // API: login
    @PostMapping("/api/login")
    @ResponseBody
    public ResponseEntity<?> apiLogin(@RequestBody Map<String, String> payload, HttpSession session) {
        String username = payload.get("username");
        String password = payload.get("password");
        return authService.login(username, password)
                .map(a -> {
                    session.setAttribute("username", a.getUsername());
                    return ResponseEntity.ok(Map.of("status", "ok", "username", a.getUsername()));
                })
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "invalid")));
    }

    // API: logout
    @PostMapping("/api/logout")
    @ResponseBody
    public ResponseEntity<?> apiLogout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    // API: get posts
    @GetMapping("/api/posts")
    @ResponseBody
    public List<Post> apiGetPosts() {
        return authService.getPosts();
    }

    // API: create post
    @PostMapping("/api/posts")
    @ResponseBody
    public ResponseEntity<?> apiCreatePost(@RequestBody Map<String, String> payload, HttpSession session) {
        String content = payload.get("content");
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }
        var author = authService.findByUsername(username).orElse(null);
        var post = authService.addPost(content, author);
        return ResponseEntity.ok(post);
    }

    // API: current user
    @GetMapping("/api/me")
    @ResponseBody
    public ResponseEntity<?> apiMe(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return ResponseEntity.ok(Map.of("authenticated", false));
        return ResponseEntity.ok(Map.of("authenticated", true, "username", username));
    }

    // API: toggle like on a post
    @PostMapping("/api/posts/{id}/like")
    @ResponseBody
    public ResponseEntity<?> apiLike(@PathVariable long id, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        try {
            int count = authService.toggleLike(id, username);
            return ResponseEntity.ok(Map.of("likes", count));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", "not_found"));
        }
    }

    // API: add comment to a post
    @PostMapping("/api/posts/{id}/comments")
    @ResponseBody
    public ResponseEntity<?> apiComment(@PathVariable long id, @RequestBody Map<String, Object> payload, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        Object textObj = payload.get("text");
        String text = textObj == null ? null : textObj.toString();
        if (text == null || text.isBlank()) return ResponseEntity.badRequest().body(Map.of("error","text_required"));
        Object parentObj = payload.get("parentId");
        Long parentId = null;
        if (parentObj != null) {
            if (parentObj instanceof Number) {
                parentId = ((Number) parentObj).longValue();
            } else {
                try { parentId = Long.parseLong(parentObj.toString()); } catch (NumberFormatException ex) { parentId = null; }
            }
        }
        try {
            var comment = authService.addComment(id, username, text, parentId);
            return ResponseEntity.ok(comment);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", "not_found"));
        }
    }

    @DeleteMapping("/api/posts/{id}")
    @ResponseBody
    public ResponseEntity<?> apiDeletePost(@PathVariable long id, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }
        try {
            authService.deletePost(id, username);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", "not_found"));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }
    }

    @DeleteMapping("/api/posts/{postId}/comments/{commentId}")
    @ResponseBody
    public ResponseEntity<?> apiDeleteComment(@PathVariable long postId, @PathVariable long commentId, HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        }
        try {
            authService.deleteComment(postId, commentId, username);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", "not_found"));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(Map.of("error", "forbidden"));
        }
    }

    // API: search users for messaging / autocomplete
    @GetMapping("/api/users")
    @ResponseBody
    public List<Map<String, String>> apiUsers(@RequestParam(name = "q", required = false) String q) {
        String query = (q == null) ? null : q.trim().toLowerCase();
        // Collect users from both in-memory AuthService and DB AccountService to ensure all registered users are found
        List<Account> combined = new ArrayList<>();
        // add in-memory users first
        try {
            var inMem = authService.listUsers();
            if (inMem != null) combined.addAll(inMem);
        } catch (Exception ignored) {}
        // add DB users (use search when query provided to be efficient)
        try {
            List<Account> db;
            if (query != null && !query.isBlank()) db = accountService.search(query);
            else db = accountService.findAll();
            if (db != null) combined.addAll(db);
        } catch (Exception ignored) {}

        // deduplicate by username (keep first occurrence)
        var byUsername = combined.stream()
                .filter(a -> a != null && a.getUsername() != null)
                .collect(Collectors.toMap(Account::getUsername, a -> a, (a1, a2) -> a1));

        final String fq = query;
        return byUsername.values().stream()
                .filter(a -> {
                    if (fq == null || fq.isBlank()) return true;
                    if (a.getUsername() != null && a.getUsername().toLowerCase().contains(fq)) return true;
                    if (a.getDisplayName() != null && a.getDisplayName().toLowerCase().contains(fq)) return true;
                    return false;
                })
                .limit(50)
                .map(a -> Map.of("username", a.getUsername(), "displayName", a.getDisplayName() == null ? "" : a.getDisplayName()))
                .collect(Collectors.toList());
    }

}
