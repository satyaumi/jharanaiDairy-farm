package com.dairyfarm.app.modules.farm.model;

import com.dairyfarm.app.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "farms")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Farm extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, length = 50)
    private String code;

    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "contact_number", length = 50)
    private String contactNumber;

    @Column(length = 150)
    private String email;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
