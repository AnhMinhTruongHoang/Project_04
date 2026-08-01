package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.EarningRate;
import com.example.demo.repositories.EarningRateRepository;
import com.example.demo.services.EarningRateService;

@Service
public class EarningRateServiceImpl
                implements EarningRateService {

        private static final Logger logger = LoggerFactory.getLogger(
                        EarningRateServiceImpl.class);

        private static final String DEFAULT_CURRENCY = "VND";

        private final EarningRateRepository earningRateRepository;

        /*
         * Giá trị dự phòng khi database chưa có
         * tỷ giá ACTIVE.
         *
         * application.properties:
         *
         * artist.earning.amount-per-qualified-stream=20
         */
        @Value("${artist.earning.amount-per-qualified-stream:20}")
        private Long fallbackAmountPerStream;

        public EarningRateServiceImpl(
                        EarningRateRepository earningRateRepository) {

                this.earningRateRepository = earningRateRepository;
        }

        /*
         * =========================================================
         * GET ACTIVE RATE
         * =========================================================
         */

        @Override
        @Transactional(readOnly = true)
        public EarningRate getActiveRate() {

                LocalDateTime now = LocalDateTime.now();

                List<EarningRate> effectiveRates = earningRateRepository.findEffectiveRates(
                                EarningRate.STATUS_ACTIVE,
                                now);

                if (!effectiveRates.isEmpty()) {

                        if (effectiveRates.size() > 1) {
                                logger.warn(
                                                "Detected {} active earning rates. "
                                                                + "Using the newest effective rate.",
                                                effectiveRates.size());
                        }

                        /*
                         * Repository đã sắp xếp:
                         * effectiveFrom DESC, createdAt DESC.
                         *
                         * Vì vậy phần tử đầu tiên là rate mới nhất.
                         */
                        return effectiveRates.get(0);
                }

                /*
                 * Database chưa có tỷ giá ACTIVE.
                 * Trả về rate tạm từ application.properties.
                 *
                 * Rate fallback này không được lưu xuống database.
                 */
                EarningRate fallbackRate = new EarningRate();

                fallbackRate.setAmountPerStream(
                                getValidFallbackAmount());

                fallbackRate.setCurrency(
                                DEFAULT_CURRENCY);

                fallbackRate.setEffectiveFrom(now);

                fallbackRate.setStatus(
                                EarningRate.STATUS_ACTIVE);

                fallbackRate.setReason(
                                "Fallback rate from application.properties");

                fallbackRate.setCreatedBy(
                                "SYSTEM");

                return fallbackRate;
        }

        @Override
        @Transactional(readOnly = true)
        public Long getActiveAmountPerStream() {

                EarningRate activeRate = getActiveRate();

                Long amountPerStream = activeRate.getAmountPerStream();

                if (amountPerStream == null
                                || amountPerStream <= 0) {

                        return getValidFallbackAmount();
                }

                return amountPerStream;
        }

        /*
         * =========================================================
         * RATE HISTORY
         * =========================================================
         */

        @Override
        @Transactional(readOnly = true)
        public Page<EarningRate> getRateHistory(
                        Pageable pageable) {

                if (pageable == null) {
                        throw new IllegalArgumentException(
                                        "Pageable is required.");
                }

                return earningRateRepository
                                .findAllByOrderByEffectiveFromDescCreatedAtDesc(
                                                pageable);
        }

        /*
         * =========================================================
         * CREATE NEW RATE
         * =========================================================
         */

        @Override
        @Transactional
        public EarningRate createRate(
                        Long amountPerStream,
                        String currency,
                        LocalDateTime effectiveFrom,
                        String reason,
                        String createdBy) {

                validateAmountPerStream(
                                amountPerStream);

                LocalDateTime now = LocalDateTime.now();

                LocalDateTime resolvedEffectiveFrom = effectiveFrom != null
                                ? effectiveFrom
                                : now;

                /*
                 * Không cho tạo tỷ giá ở quá khứ.
                 * Nếu thời gian truyền vào đã qua,
                 * áp dụng từ thời điểm hiện tại.
                 */
                if (resolvedEffectiveFrom.isBefore(now)) {
                        resolvedEffectiveFrom = now;
                }

                if (earningRateRepository.existsByEffectiveFrom(
                                resolvedEffectiveFrom)) {

                        throw new IllegalArgumentException(
                                        "An earning rate already exists "
                                                        + "at this effective time.");
                }

                EarningRate newRate = new EarningRate();

                newRate.setAmountPerStream(
                                amountPerStream);

                newRate.setCurrency(
                                normalizeCurrency(currency));

                newRate.setEffectiveFrom(
                                resolvedEffectiveFrom);

                newRate.setEffectiveTo(null);

                newRate.setReason(
                                normalizeOptionalText(reason));

                newRate.setCreatedBy(
                                normalizeOptionalText(createdBy));

                /*
                 * Rate áp dụng trong tương lai:
                 * chỉ lưu với trạng thái SCHEDULED.
                 */
                if (resolvedEffectiveFrom.isAfter(now)) {

                        newRate.setStatus(
                                        EarningRate.STATUS_SCHEDULED);

                        return earningRateRepository.save(
                                        newRate);
                }

                /*
                 * Rate áp dụng ngay:
                 * khóa và đóng toàn bộ rate ACTIVE cũ.
                 */
                List<EarningRate> currentRates = earningRateRepository
                                .findEffectiveRatesForUpdate(
                                                EarningRate.STATUS_ACTIVE,
                                                now);

                closeCurrentRates(
                                currentRates,
                                resolvedEffectiveFrom);

                newRate.setStatus(
                                EarningRate.STATUS_ACTIVE);

                return earningRateRepository.save(
                                newRate);
        }

        /*
         * =========================================================
         * ACTIVATE SCHEDULED RATES
         * =========================================================
         */

        @Override
        @Transactional
        public void activateScheduledRates() {

                LocalDateTime now = LocalDateTime.now();

                List<EarningRate> scheduledRates = earningRateRepository
                                .findByStatusOrderByEffectiveFromDesc(
                                                EarningRate.STATUS_SCHEDULED);

                if (scheduledRates.isEmpty()) {
                        return;
                }

                /*
                 * Chỉ lấy các rate đã đến thời điểm áp dụng.
                 */
                List<EarningRate> dueRates = new ArrayList<>();

                for (EarningRate rate : scheduledRates) {

                        LocalDateTime effectiveFrom = rate.getEffectiveFrom();

                        if (effectiveFrom == null) {
                                continue;
                        }

                        if (!effectiveFrom.isAfter(now)) {
                                dueRates.add(rate);
                        }
                }

                if (dueRates.isEmpty()) {
                        return;
                }

                /*
                 * Repository trả DESC.
                 *
                 * Đảo thành ASC để kích hoạt lần lượt
                 * theo đúng lịch sử thời gian.
                 */
                Collections.reverse(dueRates);

                for (EarningRate scheduledRate : dueRates) {

                        LocalDateTime activationTime = scheduledRate.getEffectiveFrom();

                        if (activationTime == null) {
                                activationTime = now;
                        }

                        List<EarningRate> currentRates = earningRateRepository
                                        .findEffectiveRatesForUpdate(
                                                        EarningRate.STATUS_ACTIVE,
                                                        now);

                        closeCurrentRates(
                                        currentRates,
                                        activationTime);

                        scheduledRate.setStatus(
                                        EarningRate.STATUS_ACTIVE);

                        scheduledRate.setEffectiveTo(null);

                        earningRateRepository.save(
                                        scheduledRate);

                        logger.info(
                                        "Activated earning rate {} VND/stream, "
                                                        + "effective from {}.",
                                        scheduledRate.getAmountPerStream(),
                                        activationTime);
                }
        }

        /*
         * =========================================================
         * PRIVATE HELPERS
         * =========================================================
         */

        private void closeCurrentRates(
                        List<EarningRate> currentRates,
                        LocalDateTime effectiveTo) {

                if (currentRates == null
                                || currentRates.isEmpty()) {

                        return;
                }

                for (EarningRate currentRate : currentRates) {

                        currentRate.setStatus(
                                        EarningRate.STATUS_INACTIVE);

                        currentRate.setEffectiveTo(
                                        effectiveTo);
                }

                earningRateRepository.saveAll(
                                currentRates);
        }

        private void validateAmountPerStream(
                        Long amountPerStream) {

                if (amountPerStream == null) {
                        throw new IllegalArgumentException(
                                        "Amount per stream is required.");
                }

                if (amountPerStream <= 0) {
                        throw new IllegalArgumentException(
                                        "Amount per stream must be greater than zero.");
                }

                /*
                 * Giới hạn bảo vệ tránh Admin nhập nhầm
                 * một tỷ giá quá lớn.
                 */
                if (amountPerStream > 100_000L) {
                        throw new IllegalArgumentException(
                                        "Amount per stream must not exceed 100,000 VND.");
                }
        }

        private Long getValidFallbackAmount() {

                if (fallbackAmountPerStream == null
                                || fallbackAmountPerStream <= 0) {

                        return 20L;
                }

                return fallbackAmountPerStream;
        }

        private String normalizeCurrency(
                        String currency) {

                if (currency == null
                                || currency.isBlank()) {

                        return DEFAULT_CURRENCY;
                }

                String normalizedCurrency = currency.trim()
                                .toUpperCase(Locale.ROOT);

                if (!DEFAULT_CURRENCY.equals(
                                normalizedCurrency)) {

                        throw new IllegalArgumentException(
                                        "Only VND currency is currently supported.");
                }

                return normalizedCurrency;
        }

        private String normalizeOptionalText(
                        String value) {

                if (value == null) {
                        return null;
                }

                String normalizedValue = value.trim();

                return normalizedValue.isEmpty()
                                ? null
                                : normalizedValue;
        }
}