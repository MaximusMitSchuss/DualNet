package com.page.dualnet.controller;

import com.page.dualnet.model.Account;
import com.page.dualnet.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import java.util.Optional;

@Controller
public class LoginController {

    private final AccountService accountService;

    @Autowired
    public LoginController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping({"/login", "/signin"})
    public String loginPage() {
        // redirect to the static login.html in resources/static
        return "redirect:/login.html";
    }

    @PostMapping("/login")
    public String login(
            @RequestParam(required = false, name = "identifier") String identifier,
            @RequestParam(required = false) String password,
            RedirectAttributes redirectAttributes,
            HttpSession session
    ) {
        String key = (identifier != null && !identifier.isBlank()) ? identifier.trim() : "";
        if (key.isEmpty() || password == null) {
            redirectAttributes.addAttribute("error", "missing");
            return "redirect:/login.html";
        }

        boolean ok = accountService.validateCredentials(key, password);
        if (!ok) {
            redirectAttributes.addAttribute("error", "invalid");
            return "redirect:/login.html";
        }

        // find the account and store the canonical username in session
        Optional<Account> oa = accountService.findByUsernameOrEmail(key);
        if (oa.isPresent()) {
            Account a = oa.get();
            String username = a.getUsername() == null ? "" : a.getUsername();
            session.setAttribute("username", username);
        }

        // success -> redirect to homepage and show a login confirmation banner
        return "redirect:/Homepage.html?login=1";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/Homepage.html";
    }
}
