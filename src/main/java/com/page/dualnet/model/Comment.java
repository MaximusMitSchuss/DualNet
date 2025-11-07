package com.page.dualnet.model;

import java.time.LocalDateTime;

public class Comment {
    private Long id;
    private String authorUsername;
    private String text;
    private LocalDateTime createdAt = LocalDateTime.now();
    private Long parentId; // optional: id of parent comment

    public Comment() {}

    public Comment(String authorUsername, String text) {
        this.authorUsername = authorUsername;
        this.text = text;
    }

    public Comment(Long id, String authorUsername, String text, Long parentId) {
        this.id = id;
        this.authorUsername = authorUsername;
        this.text = text;
        this.parentId = parentId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
}
