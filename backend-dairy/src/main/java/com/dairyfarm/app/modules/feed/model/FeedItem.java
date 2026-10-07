package com.dairyfarm.app.modules.feed.model;

import com.dairyfarm.app.common.audit.AuditableEntity;
import com.dairyfarm.app.modules.farm.model.Farm;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "feed_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_feed_item_farm_display", columnNames = {"farm_id", "display_name"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedItem extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "local_name", nullable = false, length = 100)
    private String localName;

    @Column(name = "english_name", nullable = false, length = 100)
    private String englishName;

    @Column(name = "short_name", length = 50)
    private String shortName;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String unit = "KG";

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String category = "CONCENTRATE";

    @Builder.Default
    @Column(name = "default_cost_per_unit", precision = 10, scale = 2)
    private BigDecimal defaultCostPerUnit = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
