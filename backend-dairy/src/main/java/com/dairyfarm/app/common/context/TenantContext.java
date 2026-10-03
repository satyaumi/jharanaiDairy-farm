package com.dairyfarm.app.common.context;

import java.util.UUID;

public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_FARM_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_USER_ID = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setFarmId(UUID farmId) {
        CURRENT_FARM_ID.set(farmId);
    }

    public static UUID getFarmId() {
        return CURRENT_FARM_ID.get();
    }

    public static void setUserId(UUID userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static UUID getUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void clear() {
        CURRENT_FARM_ID.remove();
        CURRENT_USER_ID.remove();
    }
}
