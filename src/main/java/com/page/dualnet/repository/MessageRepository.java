// language: java
package com.page.dualnet.repository;

import com.page.dualnet.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
            "((m.sender.username = :userA AND m.recipient.username = :userB) OR " +
            "(m.sender.username = :userB AND m.recipient.username = :userA)) " +
            "ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("userA") String userA, @Param("userB") String userB);

    List<Message> findByRecipientUsernameOrderByTimestampDesc(String username);

    List<Message> findBySenderUsernameOrRecipientUsernameOrderByTimestampDesc(String sender, String recipient);
}
