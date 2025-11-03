package com.page.dualnet.controller;

import com.page.dualnet.model.Message;
import com.page.dualnet.service.AccountService;
import com.page.dualnet.service.ChatService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ChatController {
    private final ChatService chatService;
    private final AccountService accountService;

    @Autowired
    public ChatController(ChatService chatService, AccountService accountService) {
        this.chatService = chatService;
        this.accountService = accountService;
    }

    // Search profiles by username or email (partial, case-insensitive)
    @GetMapping("/profiles")
    public List<Map<String, String>> searchProfiles(@RequestParam(required = false, name = "q") String q) {
        return accountService.readAll().stream()
                .filter(a -> {
                    if (q == null || q.isBlank()) return true;
                    String s = q.trim().toLowerCase();
                    return (a.getUsername() != null && a.getUsername().toLowerCase().contains(s)) ||
                           (a.getEmail() != null && a.getEmail().toLowerCase().contains(s));
                })
                .map(a -> {
                    Map<String,String> m = new HashMap<>();
                    m.put("username", a.getUsername());
                    m.put("email", a.getEmail());
                    return m;
                }).collect(Collectors.toList());
    }

    // Start or return existing chat id for two participants (provide 'me' and 'other')
    @PostMapping("/chats/start")
    public Map<String, String> startChat(@RequestBody Map<String, String> body) {
        String me = body.getOrDefault("me", "");
        String other = body.getOrDefault("other", "");
        String chatId = chatService.makeChatId(me, other);
        Map<String,String> resp = new HashMap<>();
        resp.put("chatId", chatId);
        return resp;
    }

    @GetMapping("/chats")
    public List<Map<String,Object>> listChats(HttpSession session) {
        List<Map<String,Object>> raw = chatService.listChats();
        // build map to resolve sanitized tokens to original display names (username or email)
        Map<String, String> tokenToDisplay = new HashMap<>();
        accountService.readAll().forEach(a -> {
            String u = a.getUsername() == null ? "" : a.getUsername();
            String e = a.getEmail() == null ? "" : a.getEmail();
            if (!u.isBlank()) tokenToDisplay.put(chatService.makeChatId(u, u).split("__")[0], u);
            if (!e.isBlank()) tokenToDisplay.put(chatService.makeChatId(e, e).split("__")[0], e);
        });

        // determine current user's token; if not logged in, return all chats
        Object usernameObj = session.getAttribute("username");
        String username = usernameObj == null ? "" : String.valueOf(usernameObj);
        String userToken = username.isBlank() ? "" : chatService.makeChatId(username, username).split("__")[0];

        // enrich and filter
        List<Map<String,Object>> out = new ArrayList<>();
        for (Map<String,Object> r : raw) {
            Object partsObj = r.get("participants");
            boolean include = true;
            if (userToken != null && !userToken.isBlank()) {
                include = false;
                if (partsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<String> parts = (List<String>) partsObj;
                    for (String p : parts) {
                        if (p != null && p.equals(userToken)) { include = true; break; }
                    }
                }
            }
            if (!include) continue;

            Map<String,Object> copy = new HashMap<>(r);
            if (partsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> parts = (List<String>) partsObj;
                List<String> display = parts.stream().map(p -> tokenToDisplay.getOrDefault(p, p)).collect(Collectors.toList());
                copy.put("participantsDisplay", display);
                copy.put("title", String.join(", ", display));
            }
            out.add(copy);
        }
        return out;
    }

    @GetMapping("/chats/{chatId}")
    public List<Message> getChat(@PathVariable String chatId) {
        return chatService.readMessages(chatId);
    }

    @PostMapping("/chats/{chatId}/messages")
    public ResponseEntity<?> postMessage(@PathVariable String chatId, @RequestBody Message message) {
        if (message == null || message.getText() == null || message.getText().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message text is required");
        }
        if (message.getTs() == 0) message.setTs(System.currentTimeMillis());
        chatService.appendMessage(chatId, message);
        return ResponseEntity.ok().build();
    }

    // return the current logged-in username from the HTTP session (if any)
    @GetMapping("/whoami")
    public Map<String, String> whoami(jakarta.servlet.http.HttpSession session) {
        Object u = session.getAttribute("username");
        Map<String,String> m = new HashMap<>();
        m.put("username", u == null ? "" : String.valueOf(u));
        return m;
    }
}
