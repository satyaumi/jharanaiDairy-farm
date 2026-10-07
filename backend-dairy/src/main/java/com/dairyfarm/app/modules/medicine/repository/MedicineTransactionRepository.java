package com.dairyfarm.app.modules.medicine.repository;

import com.dairyfarm.app.modules.medicine.model.MedicineTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicineTransactionRepository extends JpaRepository<MedicineTransaction, UUID> {
    List<MedicineTransaction> findByFarmIdOrderByTransactionDateDescCreatedAtDesc(UUID farmId);
    List<MedicineTransaction> findByFarmIdAndMedicineIdOrderByTransactionDateDescCreatedAtDesc(UUID farmId, UUID medicineId);
    List<MedicineTransaction> findByMedicineId(UUID medicineId);
}
