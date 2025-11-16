package com.page.dualnet.repository;

import com.page.dualnet.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUsername(String username);
    List<Account> findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(String usernamePart, String displayNamePart);
}
