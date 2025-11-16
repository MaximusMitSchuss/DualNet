// language: java
package com.page.dualnet.controller;

import com.page.dualnet.model.Message;
import com.page.dualnet.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Controller
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/api/messages")
    @ResponseBody
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> payload, HttpSession session) {
        String sender = (String) session.getAttribute("username");
        if (sender == null) return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));

        String recipient = payload.get("recipient");
        String content = payload.get("content");
        if (recipient == null || recipient.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "recipient_required"));
        if (content == null || content.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "content_required"));

        try {
            Message msg = messageService.sendMessage(sender, recipient.trim(), content);
            return ResponseEntity.ok(msg);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/api/messages/{with}")
    @ResponseBody
    public ResponseEntity<?> getConversation(@PathVariable String with, HttpSession session) {
        String me = (String) session.getAttribute("username");
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        try {
            List<Message> conv = messageService.getConversation(me, with);
            return ResponseEntity.ok(conv);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/api/messages")
    @ResponseBody
    public ResponseEntity<?> getInbox(HttpSession session) {
        String me = (String) session.getAttribute("username");
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        try {
            List<Message> inbox = messageService.getInbox(me);
            return ResponseEntity.ok(inbox);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/api/messages/{id}/read")
    @ResponseBody
    public ResponseEntity<?> markRead(@PathVariable Long id, HttpSession session) {
        String me = (String) session.getAttribute("username");
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "not_authenticated"));
        try {
            messageService.markAsRead(id, me);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(403).body(Map.of("error", ex.getMessage()));
        }
    }
}
