package com.dairyfarm.app.modules.user.repository;

import com.dairyfarm.app.modules.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByMobileNumber(String mobileNumber);

    @Query("SELECT u FROM User u JOIN FETCH u.farm WHERE u.username = :login OR u.email = :login OR u.mobileNumber = :login")
    Optional<User> findByUsernameOrEmailOrMobile(@Param("login") String login);

    @Query("SELECT u FROM User u JOIN FETCH u.farm WHERE u.id = :id")
    Optional<User> findByIdWithFarm(@Param("id") UUID id);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByFarmIdAndMobileNumber(UUID farmId, String mobileNumber);

    Page<User> findByFarmId(UUID farmId, Pageable pageable);

    java.util.List<User> findByFarmIdOrderByCreatedAtDesc(UUID farmId);

    Optional<User> findByInvitationToken(String invitationToken);

    boolean existsByEmployeeId(String employeeId);

    long countByFarmId(UUID farmId);

    long countByFarmIdAndRole(UUID farmId, com.dairyfarm.app.modules.user.model.Role role);

    long countByFarmIdAndActiveTrue(UUID farmId);

    long countByFarmIdAndStatus(UUID farmId, com.dairyfarm.app.modules.user.model.UserStatus status);

    @Query("SELECT u FROM User u WHERE u.farm.id = :farmId AND (" +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.mobileNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.employeeId) LIKE LOWER(CONCAT('%', :search, '%')))")
    java.util.List<User> searchFarmUsers(@Param("farmId") UUID farmId, @Param("search") String search);
}
