package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.entities.EarningRate;

import jakarta.persistence.LockModeType;

@Repository
public interface EarningRateRepository
                extends JpaRepository<EarningRate, String> {

        /*
         * Lấy toàn bộ lịch sử tỷ giá,
         * sắp xếp tỷ giá mới nhất lên đầu.
         */
        Page<EarningRate> findAllByOrderByEffectiveFromDescCreatedAtDesc(
                        Pageable pageable);

        /*
         * Tìm các tỷ giá đang có hiệu lực
         * tại thời điểm truyền vào.
         *
         * Điều kiện:
         * - status = ACTIVE
         * - effectiveFrom <= now
         * - effectiveTo chưa có hoặc effectiveTo > now
         *
         * Trả về List để Backend có thể phát hiện
         * trường hợp dữ liệu lỗi có nhiều rate ACTIVE.
         */
        @Query("""
                        SELECT rate
                        FROM EarningRate rate
                        WHERE rate.status = :status
                          AND rate.effectiveFrom <= :now
                          AND (
                                rate.effectiveTo IS NULL
                                OR rate.effectiveTo > :now
                              )
                        ORDER BY rate.effectiveFrom DESC,
                                 rate.createdAt DESC
                        """)
        List<EarningRate> findEffectiveRates(
                        @Param("status") String status,
                        @Param("now") LocalDateTime now);

        /*
         * Khóa các tỷ giá ACTIVE hiện tại
         * trong transaction khi Admin tạo rate mới.
         *
         * Tránh hai request đồng thời cùng tạo
         * hai tỷ giá ACTIVE.
         */
        @Query(value = """
                        SELECT *
                        FROM earning_rates
                        WHERE status = :status
                          AND effectiveFrom <= :now
                          AND (
                                effectiveTo IS NULL
                                OR effectiveTo > :now
                              )
                        ORDER BY effectiveFrom DESC,
                                 createdAt DESC
                        FOR UPDATE
                        """, nativeQuery = true)
        List<EarningRate> findEffectiveRatesForUpdate(
                        @Param("status") String status,
                        @Param("now") LocalDateTime now);

        /*
         * Tìm rate ACTIVE gần nhất,
         * bao gồm cả rate được lên lịch trong tương lai.
         */
        Optional<EarningRate> findFirstByStatusOrderByEffectiveFromDesc(
                        String status);

        /*
         * Lấy danh sách rate theo trạng thái.
         */
        List<EarningRate> findByStatusOrderByEffectiveFromDesc(
                        String status);

        /*
         * Kiểm tra đã có rate bắt đầu đúng
         * tại thời điểm này hay chưa.
         */
        boolean existsByEffectiveFrom(
                        LocalDateTime effectiveFrom);
}