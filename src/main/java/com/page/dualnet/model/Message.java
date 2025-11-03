package com.page.dualnet.model;

public class Message {
    private String sender;
    private String text;
    private long ts;

    public Message() {}

    public Message(String sender, String text, long ts) {
        this.sender = sender;
        this.text = text;
        this.ts = ts;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public long getTs() {
        return ts;
    }

    public void setTs(long ts) {
        this.ts = ts;
    }
}

