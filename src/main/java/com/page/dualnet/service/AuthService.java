package com.page.dualnet.service;

import com.page.dualnet.model.Account;
import com.page.dualnet.model.Comment;
import com.page.dualnet.model.Post;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AuthService {

    private final Map<String, Account> users = new ConcurrentHashMap<>();
    private final Map<Long, Post> postsById = new ConcurrentHashMap<>();
    private final List<Post> posts = new CopyOnWriteArrayList<>();
    private final AtomicLong postIdSeq = new AtomicLong(1);
    private final AtomicLong commentIdSeq = new AtomicLong(1);

    public Optional<Account> findByUsername(String username) {
        return Optional.ofNullable(users.get(username));
    }

    public Account register(Account account) {
        // simple in-memory register; in production check and hash password
        users.put(account.getUsername(), account);
        return account;
    }

    public Optional<Account> login(String username, String password) {
        Account a = users.get(username);
        if (a != null && Objects.equals(a.getPassword(), password)) {
            return Optional.of(a);
        }
        return Optional.empty();
    }

    public List<Post> getPosts() {
        // return copy sorted by createdAt desc
        List<Post> copy = new ArrayList<>(posts);
        copy.sort(Comparator.comparing(Post::getCreatedAt).reversed());
        return copy;
    }

    public Post addPost(String content, Account author) {
        Post p = new Post();
        p.setId(postIdSeq.getAndIncrement());
        p.setContent(content);
        p.setCreatedAt(LocalDateTime.now());
        p.setAuthor(author);
        posts.add(0, p);
        postsById.put(p.getId(), p);
        return p;
    }

    public List<Account> listUsers() {
        return new ArrayList<>(users.values());
    }

    // Toggle like for a post by id and username; returns current like count
    public int toggleLike(long postId, String username) {
        Post p = postsById.get(postId);
        if (p == null) throw new NoSuchElementException("post not found");
        boolean likedNow = p.toggleLike(username);
        return p.getLikes().size();
    }

    // Add a comment to a post
    public Comment addComment(long postId, String username, String text) {
        return addComment(postId, username, text, null);
    }

    // overload with optional parentId
    public Comment addComment(long postId, String username, String text, Long parentId) {
        Post p = postsById.get(postId);
        if (p == null) throw new NoSuchElementException("post not found");
        Comment c = new Comment(commentIdSeq.getAndIncrement(), username, text, parentId);
        p.addComment(c);
        return c;
    }

    public void deletePost(long postId, String username) {
        if (username == null || username.isBlank()) {
            throw new SecurityException("not_authenticated");
        }
        Post p = postsById.get(postId);
        if (p == null) {
            throw new NoSuchElementException("post not found");
        }
        String owner = (p.getAuthor() != null) ? p.getAuthor().getUsername() : null;
        if (owner != null && !owner.equals(username)) {
            throw new SecurityException("forbidden");
        }
        posts.removeIf(existing -> Objects.equals(existing.getId(), postId));
        postsById.remove(postId);
    }

    public void deleteComment(long postId, long commentId, String username) {
        if (username == null || username.isBlank()) {
            throw new SecurityException("not_authenticated");
        }
        Post p = postsById.get(postId);
        if (p == null) {
            throw new NoSuchElementException("post not found");
        }
        List<Comment> comments = p.getComments();
        if (comments == null || comments.isEmpty()) {
            throw new NoSuchElementException("comment not found");
        }
        Comment target = comments.stream()
                .filter(c -> Objects.equals(c.getId(), commentId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("comment not found"));

        String owner = (p.getAuthor() != null) ? p.getAuthor().getUsername() : null;
        boolean allowed = username.equals(target.getAuthorUsername()) || (owner != null && owner.equals(username));
        if (!allowed) {
            throw new SecurityException("forbidden");
        }

        Set<Long> idsToRemove = collectCommentCascade(commentId, comments);
        comments.removeIf(c -> idsToRemove.contains(c.getId()));
    }

    private Set<Long> collectCommentCascade(Long rootId, List<Comment> comments) {
        Set<Long> ids = new HashSet<>();
        if (rootId == null) {
            return ids;
        }
        Deque<Long> stack = new ArrayDeque<>();
        stack.push(rootId);
        while (!stack.isEmpty()) {
            Long current = stack.pop();
            ids.add(current);
            comments.stream()
                    .filter(c -> Objects.equals(c.getParentId(), current))
                    .map(Comment::getId)
                    .filter(Objects::nonNull)
                    .forEach(stack::push);
        }
        return ids;
    }
}
