package com.page.dualnet.modeltxt;

public class Account {
    private String username;
    private String email;
    private String password;
    private String displayName;
    private String bio;

    public Account() {}

    public Account(String username, String email, String password) {
        this(username, email, password, "", "");
    }

    public Account(String username, String email, String password, String displayName, String bio) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.bio = bio;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    @Override
    public String toString() {
        // CSV-escaped: username,email,password,displayName,bio
        return String.format("%s,%s,%s,%s,%s",
                escape(username), escape(email), escape(password), escape(displayName), escape(bio));
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace(",", "\\,").replace("\n", "\\n");
    }
}
