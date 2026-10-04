package com.dairyfarm.app.modules.auth.repository;

import com.dairyfarm.app.modules.auth.model.AuthOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthOtpRepository extends JpaRepository<AuthOtp, UUID> {

    Optional<AuthOtp> findFirstByIdentifierAndPurposeAndConsumedFalseOrderByCreatedAtDesc(
            String identifier, String purpose);

    List<AuthOtp> findByIdentifierAndPurposeAndConsumedFalse(String identifier, String purpose);

    @Modifying
    @Query("UPDATE AuthOtp o SET o.consumed = true WHERE o.identifier = :identifier AND o.purpose = :purpose AND o.consumed = false")
    void invalidateActiveOtps(@Param("identifier") String identifier, @Param("purpose") String purpose);

    @Modifying
    @Query("DELETE FROM AuthOtp o WHERE o.expiresAt < :now")
    void deleteAllExpiredBefore(@Param("now") Instant now);
}
