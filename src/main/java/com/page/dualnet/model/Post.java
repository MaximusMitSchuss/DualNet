package com.page.dualnet.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String content;

    private String imageUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    private Account author;

    // Transient fields used while DB is not the source of truth yet
    @Transient
    private Set<String> likes = new HashSet<>();

    @Transient
    private List<Comment> comments = new ArrayList<>();

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Account getAuthor() { return author; }
    public void setAuthor(Account author) { this.author = author; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Set<String> getLikes() { return likes; }
    public void setLikes(Set<String> likes) { this.likes = likes; }

    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }

    // add a like by username; returns current like count
    public int addLike(String username) {
        likes.add(username);
        return likes.size();
    }

    // remove a like by username; returns current like count
    public int removeLike(String username) {
        likes.remove(username);
        return likes.size();
    }

    // toggle like: returns true if liked now, false if unliked
    public boolean toggleLike(String username) {
        if (likes.contains(username)) { likes.remove(username); return false; }
        likes.add(username); return true;
    }

    // add comment
    public void addComment(Comment c) {
        comments.add(c);
    }
}
