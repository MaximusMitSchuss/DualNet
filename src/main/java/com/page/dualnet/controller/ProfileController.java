package com.page.dualnet.controller;

import com.page.dualnet.model.Account;
import com.page.dualnet.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/api")
public class ProfileController {

    private final AccountService accountService;

    @Autowired
    public ProfileController(AccountService accountService) {
        this.accountService = accountService;
    }

    // return public profile for a username (or empty if not found)
    @GetMapping("/profile/{username}")
    @ResponseBody
    public ResponseEntity<?> getProfilePublic(@PathVariable String username) {
        Optional<Account> oa = accountService.findByUsernameOrEmail(username);
        if (oa.isEmpty()) return ResponseEntity.notFound().build();
        Account a = oa.get();
        Map<String,String> m = new HashMap<>();
        m.put("username", a.getUsername() == null ? "" : a.getUsername());
        m.put("displayName", a.getDisplayName() == null ? "" : a.getDisplayName());
        m.put("bio", a.getBio() == null ? "" : a.getBio());
        return ResponseEntity.ok(m);
    }

    // return profile of current session user (empty if not logged in)
    @GetMapping("/profile")
    @ResponseBody
    public ResponseEntity<?> getMyProfile(HttpSession session) {
        Object u = session.getAttribute("username");
        if (u == null) return ResponseEntity.ok(new HashMap<>());
        String username = String.valueOf(u);
        Optional<Account> oa = accountService.findByUsernameOrEmail(username);
        if (oa.isEmpty()) return ResponseEntity.ok(new HashMap<>());
        Account a = oa.get();
        Map<String,String> m = new HashMap<>();
        m.put("username", a.getUsername() == null ? "" : a.getUsername());
        m.put("displayName", a.getDisplayName() == null ? "" : a.getDisplayName());
        m.put("bio", a.getBio() == null ? "" : a.getBio());
        m.put("email", a.getEmail() == null ? "" : a.getEmail());
        return ResponseEntity.ok(m);
    }

    // update current user's profile (only displayName and bio and optional email/password)
    @PostMapping("/profile")
    @ResponseBody
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String,String> body, HttpSession session) {
        Object u = session.getAttribute("username");
        if (u == null) return ResponseEntity.status(403).body("not_logged_in");
        String username = String.valueOf(u);
        Optional<Account> oa = accountService.findByUsernameOrEmail(username);
        if (oa.isEmpty()) return ResponseEntity.status(404).body("not_found");
        Account current = oa.get();
        Account updated = new Account();
        // allow updating displayName, bio, email, password (username change not supported here)
        updated.setDisplayName(body.getOrDefault("displayName", current.getDisplayName()));
        updated.setBio(body.getOrDefault("bio", current.getBio()));
        if (body.containsKey("email") && body.get("email") != null && !body.get("email").isBlank()) {
            updated.setEmail(body.get("email"));
        }
        if (body.containsKey("password") && body.get("password") != null) {
            String pw = body.get("password");
            if (!pw.isEmpty()) updated.setPassword(pw);
        }
        boolean ok = accountService.updateAccount(current.getUsername(), updated);
        if (!ok) return ResponseEntity.status(500).body("update_failed");
        return ResponseEntity.ok().build();
    }
}

