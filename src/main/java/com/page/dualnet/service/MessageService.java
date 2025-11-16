// language: java
package com.page.dualnet.service;

import com.page.dualnet.model.Account;
import com.page.dualnet.model.Message;
import com.page.dualnet.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final AuthService authService;

    public MessageService(MessageRepository messageRepository, AuthService authService) {
        this.messageRepository = messageRepository;
        this.authService = authService;
    }

    @Transactional
    public Message sendMessage(String senderUsername, String recipientUsername, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content_required");
        }
        Account sender = authService.findByUsername(senderUsername)
                .orElseThrow(() -> new NoSuchElementException("sender_not_found"));
        Account recipient = authService.findByUsername(recipientUsername)
                .orElseThrow(() -> new NoSuchElementException("recipient_not_found"));

        Message m = new Message(sender, recipient, content.trim(), LocalDateTime.now());
        return messageRepository.save(m);
    }

    @Transactional(readOnly = true)
    public List<Message> getConversation(String a, String b) {
        // ensure both users exist
        authService.findByUsername(a).orElseThrow(() -> new NoSuchElementException("user_a_not_found"));
        authService.findByUsername(b).orElseThrow(() -> new NoSuchElementException("user_b_not_found"));
        return messageRepository.findConversation(a, b);
    }

    @Transactional(readOnly = true)
    public List<Message> getInbox(String username) {
        authService.findByUsername(username).orElseThrow(() -> new NoSuchElementException("user_not_found"));
        return messageRepository.findByRecipientUsernameOrderByTimestampDesc(username);
    }

    @Transactional
    public void markAsRead(Long messageId, String username) {
        Message m = messageRepository.findById(messageId).orElseThrow(() -> new NoSuchElementException("msg_not_found"));
        if (!m.getRecipient().getUsername().equals(username)) {
            throw new IllegalArgumentException("not_recipient");
        }
        m.setUnread(false);
        messageRepository.save(m);
    }
}
