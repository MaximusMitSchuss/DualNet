package com.page.dualnet.service;

import com.page.dualnet.model.Account;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {
    // TODO: Replace file-based storage with a database-backed repository (e.g. Spring Data JPA).
    private final Path dataFile = Paths.get("data", "accounts.txt");

    public AccountService() {
        // TODO: Move initialization of persistence (DB connections, migrations) here instead of file creation.
        try {
            Path dir = dataFile.getParent();
            if (dir != null && !Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            if (!Files.exists(dataFile)) {
                Files.createFile(dataFile);
            }
        } catch (IOException e) {
            throw new RuntimeException("Unable to initialize accounts data file", e);
        }
    }

    public synchronized void save(Account account) {
        // TODO: Persist account to the database instead of appending to a file.
        String line = account.toString() + System.lineSeparator();
        try {
            Files.write(dataFile, line.getBytes(), StandardOpenOption.APPEND);
        } catch (IOException e) {
            throw new RuntimeException("Unable to write account to file", e);
        }
    }

    // Read all accounts from the file
    public synchronized List<Account> readAll() {
        // TODO: Query all accounts from the database instead of reading the file.
        List<Account> out = new ArrayList<>();
        try {
            List<String> lines = Files.readAllLines(dataFile);
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;
                Account a = parseLine(line);
                if (a != null) out.add(a);
            }
        } catch (IOException e) {
            throw new RuntimeException("Unable to read accounts file", e);
        }
        return out;
    }

    public synchronized boolean existsByUsernameOrEmail(String username, String email) {
        // TODO: Implement efficient database checks (unique index on username/email) instead of scanning readAll().
        if (username != null) username = username.trim();
        if (email != null) email = email.trim();
        for (Account a : readAll()) {
            if (username != null && !username.isEmpty() && username.equalsIgnoreCase(a.getUsername())) return true;
            if (email != null && !email.isEmpty() && email.equalsIgnoreCase(a.getEmail())) return true;
        }
        return false;
    }

    public synchronized Optional<Account> findByUsernameOrEmail(String usernameOrEmail) {
        // TODO: Replace with a DB query (SELECT ... WHERE username = ? OR email = ?), return Optional.empty() when not found.
        if (usernameOrEmail == null) return Optional.empty();
        String key = usernameOrEmail.trim();
        for (Account a : readAll()) {
            if (key.equalsIgnoreCase(a.getUsername()) || key.equalsIgnoreCase(a.getEmail())) {
                return Optional.of(a);
            }
        }
        return Optional.empty();
    }

    public synchronized boolean validateCredentials(String usernameOrEmail, String password) {
        // TODO: Validate credentials against hashed passwords stored in the database (not plain text comparison).
        Optional<Account> oa = findByUsernameOrEmail(usernameOrEmail);
        if (oa.isEmpty()) return false;
        Account a = oa.get();
        String pw = a.getPassword() == null ? "" : a.getPassword();
        return pw.equals(password == null ? "" : password);
    }

    // Update an existing account identified by username. Returns true if updated, false if not found.
    public synchronized boolean updateAccount(String username, Account updated) {
        // TODO: Implement update via database transaction (UPDATE ... WHERE username = ?), return success flag appropriately.
        if (username == null) return false;
        List<Account> all = readAll();
        boolean found = false;
        for (int i = 0; i < all.size(); i++) {
            Account a = all.get(i);
            if (username.equalsIgnoreCase(a.getUsername())) {
                // preserve original username and email unless updated explicitly
                String uname = a.getUsername();
                String email = a.getEmail();
                String pw = a.getPassword();
                // replace fields from updated if provided (non-null)
                if (updated.getUsername() != null && !updated.getUsername().isBlank()) uname = updated.getUsername();
                if (updated.getEmail() != null && !updated.getEmail().isBlank()) email = updated.getEmail();
                if (updated.getPassword() != null) pw = updated.getPassword();
                String display = updated.getDisplayName() == null ? a.getDisplayName() : updated.getDisplayName();
                String bio = updated.getBio() == null ? a.getBio() : updated.getBio();
                Account newAcc = new Account(uname, email, pw, display, bio);
                all.set(i, newAcc);
                found = true;
                break;
            }
        }
        if (!found) return false;
        // write all back to file atomically
        try {
            StringBuilder sb = new StringBuilder();
            for (Account ac : all) {
                sb.append(ac.toString()).append(System.lineSeparator());
            }
            Files.writeString(dataFile, sb.toString(), StandardOpenOption.TRUNCATE_EXISTING);
            return true;
        } catch (IOException e) {
            throw new RuntimeException("Unable to write accounts file", e);
        }
    }

    // helpers to parse the CSV-like escaped format used by Account#toString
    private Account parseLine(String line) {
        List<String> parts = splitEscaped(line);
        String u = parts.size() > 0 ? unescape(parts.get(0)) : "";
        String e = parts.size() > 1 ? unescape(parts.get(1)) : "";
        String p = parts.size() > 2 ? unescape(parts.get(2)) : "";
        String d = parts.size() > 3 ? unescape(parts.get(3)) : "";
        String b = parts.size() > 4 ? unescape(parts.get(4)) : "";
        return new Account(u, e, p, d, b);
    }

    private List<String> splitEscaped(String s) {
        List<String> parts = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        int len = s.length();
        for (int i = 0; i < len; i++) {
            char c = s.charAt(i);
            if (c == ',') {
                // count preceding backslashes
                int backslashes = 0;
                int j = i - 1;
                while (j >= 0 && s.charAt(j) == '\\') {
                    backslashes++;
                    j--;
                }
                if (backslashes % 2 == 0) {
                    // comma is a separator
                    parts.add(cur.toString());
                    cur.setLength(0);
                    continue;
                }
            }
            cur.append(c);
        }
        parts.add(cur.toString());
        return parts;
    }

    private String unescape(String s) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char n = s.charAt(i + 1);
                if (n == 'n') {
                    out.append('\n');
                } else if (n == ',') {
                    out.append(',');
                } else if (n == '\\') {
                    out.append('\\');
                } else {
                    // unknown escape, keep next char as-is
                    out.append(n);
                }
                i++; // skip next
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }
}
