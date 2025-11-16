package com.page.dualnet.service;

import com.page.dualnet.model.Account;
import com.page.dualnet.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository repo;

    public AccountService(AccountRepository repo) {
        this.repo = repo;
    }

    public List<Account> findAll() { return repo.findAll(); }
    public List<Account> search(String q) { return repo.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(q, q); }
    public Optional<Account> findById(Long id) { return repo.findById(id); }
    public Optional<Account> findByUsername(String username) { return repo.findByUsername(username); }
    public Account save(Account a) { return repo.save(a); }
}
