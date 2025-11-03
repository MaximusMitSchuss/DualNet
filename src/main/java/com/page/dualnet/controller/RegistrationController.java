package com.page.dualnet.controller;

import com.page.dualnet.model.Account;
import com.page.dualnet.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;

@Controller
public class RegistrationController {

    private final AccountService accountService;

    @Autowired
    public RegistrationController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/register")
    public String register(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false, name = "passwordConfirm") String passwordConfirm,
            RedirectAttributes redirectAttributes,
            HttpSession session
    ) {
        if (username == null || username.isBlank() || email == null || email.isBlank()) {
            redirectAttributes.addAttribute("error", "missing");
            return "redirect:/registration.html";
        }

        String p = password == null ? "" : password;
        String pc = passwordConfirm == null ? "" : passwordConfirm;

        if (!p.equals(pc)) {
            redirectAttributes.addAttribute("error", "mismatch");
            return "redirect:/registration.html";
        }

        if (p.isBlank()) {
            redirectAttributes.addAttribute("error", "missing_password");
            return "redirect:/registration.html";
        }

        // check if account with same username or email already exists
        if (accountService.existsByUsernameOrEmail(username.trim(), email.trim())) {
            redirectAttributes.addAttribute("error", "exists");
            return "redirect:/registration.html";
        }

        Account account = new Account(username.trim(), email.trim(), p);
        accountService.save(account);
        // set session username so user is considered logged in
        session.setAttribute("username", account.getUsername());
        // on success, redirect to homepage with a registered flag
        return "redirect:/Homepage.html?registered=1";
    }
}
