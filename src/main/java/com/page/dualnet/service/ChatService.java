package com.page.dualnet.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.page.dualnet.model.Message;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private final Path dataDir = Paths.get("data", "chats");
    private final ObjectMapper mapper = new ObjectMapper();

    public ChatService() {
        try {
            if (!Files.exists(dataDir)) Files.createDirectories(dataDir);
        } catch (IOException e) {
            throw new RuntimeException("Unable to initialize chats directory", e);
        }
    }

    // make a deterministic chat id for two participants
    public String makeChatId(String a, String b) {
        if (a == null) a = "";
        if (b == null) b = "";
        String s1 = sanitize(a);
        String s2 = sanitize(b);
        List<String> parts = List.of(s1, s2).stream().sorted().collect(Collectors.toList());
        return String.join("__", parts);
    }

    private String sanitize(String s) {
        return s.trim().toLowerCase().replaceAll("[^a-z0-9_-]", "_");
    }

    private Path chatFile(String chatId) {
        return dataDir.resolve(chatId + ".txt");
    }

    public synchronized void appendMessage(String chatId, Message msg) {
        Path file = chatFile(chatId);
        try {
            if (!Files.exists(file)) Files.createFile(file);
            String line = mapper.writeValueAsString(msg) + System.lineSeparator();
            try (BufferedWriter w = Files.newBufferedWriter(file, StandardCharsets.UTF_8, StandardOpenOption.APPEND)) {
                w.write(line);
            }
        } catch (IOException e) {
            throw new RuntimeException("Unable to append message to chat file", e);
        }
    }

    public synchronized List<Message> readMessages(String chatId) {
        Path file = chatFile(chatId);
        List<Message> out = new ArrayList<>();
        if (!Files.exists(file)) return out;
        try {
            List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
            for (String l : lines) {
                if (l == null || l.isBlank()) continue;
                try {
                    Message m = mapper.readValue(l, Message.class);
                    out.add(m);
                } catch (IOException ex) {
                    // skip malformed line
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Unable to read chat file", e);
        }
        out.sort(Comparator.comparingLong(Message::getTs));
        return out;
    }

    // list available chats (returns map with chatId and participants and message count)
    public synchronized List<Map<String, Object>> listChats() {
        List<Map<String, Object>> out = new ArrayList<>();
        try {
            if (!Files.exists(dataDir)) return out;
            Files.list(dataDir).forEach(p -> {
                String name = p.getFileName().toString();
                if (!name.endsWith(".txt")) return;
                String chatId = name.substring(0, name.length()-4);
                String[] parts = chatId.split("__");
                List<String> participants = List.of(parts).stream().map(String::valueOf).collect(Collectors.toList());
                Map<String, Object> m = new HashMap<>();
                m.put("chatId", chatId);
                m.put("participants", participants);
                try {
                    long lines = Files.lines(p).count();
                    m.put("messageCount", lines);
                } catch (IOException e) {
                    m.put("messageCount", 0);
                }
                out.add(m);
            });
        } catch (IOException e) {
            throw new RuntimeException("Unable to list chat files", e);
        }
        return out;
    }
}

