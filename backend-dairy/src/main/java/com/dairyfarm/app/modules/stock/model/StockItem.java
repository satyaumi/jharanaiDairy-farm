package com.dairyfarm.app.modules.stock.model;

import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.feed.model.FeedItem;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_stock_item_farm_name", columnNames = {"farm_id", "item_name"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feed_item_id")
    private FeedItem feedItem;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String category = "FEED"; // FEED, MEDICINE, OTHER

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String unit = "KG";

    @Builder.Default
    @Column(name = "min_threshold", precision = 10, scale = 2)
    private BigDecimal minThreshold = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
