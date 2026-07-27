package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.CreateArtistPayoutRequestDTO;
import com.example.demo.entities.ArtistPayoutRequest;
import com.example.demo.entities.ArtistWallet;
import com.example.demo.repositories.ArtistPayoutRequestRepository;
import com.example.demo.repositories.ArtistWalletRepository;
import com.example.demo.dtos.AdminArtistPayoutActionDTO;

@Service
public class ArtistPayoutService {

        private static final String CURRENCY_VND = "VND";

        private final ArtistPayoutRequestRepository artistPayoutRequestRepository;

        private final ArtistWalletRepository artistWalletRepository;

        /*
         * Mức rút tối thiểu mặc định: 100.000 VND.
         */
        @Value("${artist.payout.minimum-amount:100000}")
        private long minimumPayoutAmount;

        /*
         * Mức rút tối đa cho một yêu cầu.
         */
        @Value("${artist.payout.maximum-amount:100000000}")
        private long maximumPayoutAmount;

        public ArtistPayoutService(
                        ArtistPayoutRequestRepository artistPayoutRequestRepository,
                        ArtistWalletRepository artistWalletRepository) {

                this.artistPayoutRequestRepository = artistPayoutRequestRepository;

                this.artistWalletRepository = artistWalletRepository;
        }

        /*
         * =========================
         * CREATE PAYOUT REQUEST
         * =========================
         */
        @Transactional
        public Map<String, Object> createPayoutRequest(
                        String artistId,
                        CreateArtistPayoutRequestDTO dto) {

                validateArtistId(
                                artistId);

                validateCreateRequest(
                                dto);

                /*
                 * Khóa ví trước để mọi yêu cầu rút tiền
                 * của cùng Artist được xử lý tuần tự.
                 */
                ArtistWallet wallet = artistWalletRepository
                                .findByArtistIdForUpdate(
                                                artistId)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist wallet not found"));

                if (!ArtistWallet.STATUS_ACTIVE
                                .equalsIgnoreCase(
                                                wallet.getStatus())) {

                        throw new IllegalStateException(
                                        "Artist wallet is not active");
                }

                /*
                 * Artist không được tạo yêu cầu mới
                 * khi đang có yêu cầu chờ xử lý.
                 */
                boolean activeRequestExists = artistPayoutRequestRepository
                                .existsByArtistIdAndStatusIn(
                                                artistId,
                                                List.of(
                                                                ArtistPayoutRequest.STATUS_PENDING,
                                                                ArtistPayoutRequest.STATUS_APPROVED));

                if (activeRequestExists) {
                        throw new IllegalStateException(
                                        "An active payout request already exists");
                }

                long amount = dto.getAmount();

                long availableBalance = safeMoney(
                                wallet.getAvailableBalance());

                long reservedBalance = safeMoney(
                                wallet.getReservedBalance());

                if (availableBalance < amount) {
                        throw new IllegalArgumentException(
                                        "Insufficient available balance");
                }

                LocalDateTime now = LocalDateTime.now();

                ArtistPayoutRequest payoutRequest = new ArtistPayoutRequest();

                payoutRequest.setArtistId(
                                artistId);

                payoutRequest.setWalletId(
                                wallet.getId());

                payoutRequest.setAmount(
                                amount);

                payoutRequest.setCurrency(
                                CURRENCY_VND);

                payoutRequest.setPayoutMethod(
                                ArtistPayoutRequest.METHOD_BANK_TRANSFER);

                payoutRequest.setStatus(
                                ArtistPayoutRequest.STATUS_PENDING);

                payoutRequest.setBankCode(
                                normalizeBankCode(
                                                dto.getBankCode()));

                payoutRequest.setBankName(
                                normalizeRequiredText(
                                                dto.getBankName(),
                                                "Bank name",
                                                100));

                payoutRequest.setAccountNumber(
                                normalizeAccountNumber(
                                                dto.getAccountNumber()));

                payoutRequest.setAccountHolderName(
                                normalizeAccountHolderName(
                                                dto.getAccountHolderName()));

                payoutRequest.setArtistNote(
                                normalizeOptionalText(
                                                dto.getArtistNote(),
                                                500));

                payoutRequest.setRequestedAt(
                                now);

                /*
                 * Giữ tiền trong cùng transaction.
                 */
                wallet.setAvailableBalance(
                                Math.subtractExact(
                                                availableBalance,
                                                amount));

                wallet.setReservedBalance(
                                Math.addExact(
                                                reservedBalance,
                                                amount));

                ArtistWallet savedWallet = artistWalletRepository.save(
                                wallet);

                ArtistPayoutRequest savedRequest = artistPayoutRequestRepository
                                .saveAndFlush(
                                                payoutRequest);

                return buildPayoutResult(
                                savedRequest,
                                savedWallet);
        }

        /*
         * =========================
         * CANCEL PAYOUT REQUEST
         * =========================
         */
        @Transactional
        public Map<String, Object> cancelPayoutRequest(
                        String artistId,
                        String payoutRequestId) {

                validateArtistId(
                                artistId);

                if (payoutRequestId == null
                                || payoutRequestId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Payout request ID is required");
                }

                ArtistPayoutRequest payoutRequest = artistPayoutRequestRepository
                                .findByIdAndArtistIdForUpdate(
                                                payoutRequestId.trim(),
                                                artistId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Payout request not found"));

                /*
                 * Artist chỉ được hủy khi Admin
                 * chưa duyệt yêu cầu.
                 */
                if (!ArtistPayoutRequest.STATUS_PENDING
                                .equals(
                                                payoutRequest.getStatus())) {

                        throw new IllegalStateException(
                                        "Only pending payout requests can be canceled");
                }

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistIdForUpdate(
                                                artistId)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist wallet not found"));

                long amount = safeMoney(
                                payoutRequest.getAmount());

                long reservedBalance = safeMoney(
                                wallet.getReservedBalance());

                long availableBalance = safeMoney(
                                wallet.getAvailableBalance());

                if (reservedBalance < amount) {
                        throw new IllegalStateException(
                                        "Reserved wallet balance is inconsistent");
                }

                /*
                 * Hoàn tiền đã giữ về availableBalance.
                 */
                wallet.setReservedBalance(
                                reservedBalance - amount);

                wallet.setAvailableBalance(
                                Math.addExact(
                                                availableBalance,
                                                amount));

                LocalDateTime now = LocalDateTime.now();

                payoutRequest.setStatus(
                                ArtistPayoutRequest.STATUS_CANCELED);

                payoutRequest.setCanceledAt(
                                now);

                ArtistWallet savedWallet = artistWalletRepository.save(
                                wallet);

                ArtistPayoutRequest savedRequest = artistPayoutRequestRepository
                                .saveAndFlush(
                                                payoutRequest);

                return buildPayoutResult(
                                savedRequest,
                                savedWallet);
        }

        /*
         * =========================
         * GET ARTIST PAYOUT HISTORY
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getArtistPayoutHistory(
                        String artistId,
                        String status,
                        int current,
                        int pageSize) {

                validateArtistId(
                                artistId);

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                100);

                Pageable pageable = PageRequest.of(
                                normalizedCurrent - 1,
                                normalizedPageSize);

                String normalizedStatus = normalizePayoutStatus(
                                status);

                Page<ArtistPayoutRequest> payoutPage;

                if (normalizedStatus == null) {

                        payoutPage = artistPayoutRequestRepository
                                        .findByArtistIdOrderByRequestedAtDesc(
                                                        artistId,
                                                        pageable);

                } else {

                        payoutPage = artistPayoutRequestRepository
                                        .findByArtistIdAndStatusOrderByRequestedAtDesc(
                                                        artistId,
                                                        normalizedStatus,
                                                        pageable);
                }

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "current",
                                normalizedCurrent);

                result.put(
                                "pageSize",
                                normalizedPageSize);

                result.put(
                                "totalPages",
                                payoutPage.getTotalPages());

                result.put(
                                "totalItems",
                                payoutPage.getTotalElements());

                result.put(
                                "status",
                                normalizedStatus);

                result.put(
                                "result",
                                payoutPage
                                                .getContent()
                                                .stream()
                                                .map(this::toPayoutResponse)
                                                .toList());

                return result;
        }

        /*
         * =========================
         * ADMIN APPROVE PAYOUT
         * =========================
         */
        @Transactional
        public Map<String, Object> approvePayoutRequest(
                        String adminId,
                        String payoutRequestId,
                        AdminArtistPayoutActionDTO dto) {

                validateAdminAction(
                                adminId,
                                payoutRequestId);

                ArtistPayoutRequest payoutRequest = artistPayoutRequestRepository
                                .findByIdForUpdate(
                                                payoutRequestId.trim())
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Payout request not found"));

                if (!ArtistPayoutRequest.STATUS_PENDING
                                .equals(
                                                payoutRequest.getStatus())) {

                        throw new IllegalStateException(
                                        "Only pending payout requests can be approved");
                }

                LocalDateTime now = LocalDateTime.now();

                payoutRequest.setStatus(
                                ArtistPayoutRequest.STATUS_APPROVED);

                payoutRequest.setAdminNote(
                                normalizeOptionalText(
                                                dto == null
                                                                ? null
                                                                : dto.getAdminNote(),
                                                500));

                payoutRequest.setReviewedBy(
                                adminId);

                payoutRequest.setReviewedAt(
                                now);

                payoutRequest.setApprovedAt(
                                now);

                ArtistPayoutRequest savedRequest = artistPayoutRequestRepository
                                .saveAndFlush(
                                                payoutRequest);

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistId(
                                                payoutRequest.getArtistId())
                                .orElse(null);

                return buildAdminActionResult(
                                savedRequest,
                                wallet);
        }

        private Map<String, Object> buildAdminActionResult(
                        ArtistPayoutRequest payoutRequest,
                        ArtistWallet wallet) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "payoutRequest",
                                toPayoutResponse(
                                                payoutRequest));

                result.put(
                                "availableBalance",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getAvailableBalance()));

                result.put(
                                "reservedBalance",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getReservedBalance()));

                result.put(
                                "withdrawnBalance",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getWithdrawnBalance()));

                result.put(
                                "currency",
                                wallet == null
                                                ? payoutRequest.getCurrency()
                                                : wallet.getCurrency());

                return result;
        }

        /*
         * =========================
         * RESPONSE
         * =========================
         */
        private Map<String, Object> buildPayoutResult(
                        ArtistPayoutRequest payoutRequest,
                        ArtistWallet wallet) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "payoutRequest",
                                toPayoutResponse(
                                                payoutRequest));

                result.put(
                                "walletId",
                                wallet.getId());

                result.put(
                                "availableBalance",
                                safeMoney(
                                                wallet.getAvailableBalance()));

                result.put(
                                "reservedBalance",
                                safeMoney(
                                                wallet.getReservedBalance()));

                result.put(
                                "withdrawnBalance",
                                safeMoney(
                                                wallet.getWithdrawnBalance()));

                result.put(
                                "currency",
                                wallet.getCurrency());

                return result;
        }

        private Map<String, Object> toPayoutResponse(
                        ArtistPayoutRequest payoutRequest) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                payoutRequest.getId());

                result.put(
                                "artistId",
                                payoutRequest.getArtistId());

                result.put(
                                "walletId",
                                payoutRequest.getWalletId());

                result.put(
                                "amount",
                                safeMoney(
                                                payoutRequest.getAmount()));

                result.put(
                                "currency",
                                payoutRequest.getCurrency());

                result.put(
                                "payoutMethod",
                                payoutRequest.getPayoutMethod());

                result.put(
                                "status",
                                payoutRequest.getStatus());

                result.put(
                                "bankCode",
                                payoutRequest.getBankCode());

                result.put(
                                "bankName",
                                payoutRequest.getBankName());

                result.put(
                                "accountNumber",
                                payoutRequest.getAccountNumber());

                result.put(
                                "accountHolderName",
                                payoutRequest.getAccountHolderName());

                result.put(
                                "artistNote",
                                payoutRequest.getArtistNote());

                result.put(
                                "adminNote",
                                payoutRequest.getAdminNote());

                result.put(
                                "transactionReference",
                                payoutRequest.getTransactionReference());

                result.put(
                                "reviewedBy",
                                payoutRequest.getReviewedBy());

                result.put(
                                "requestedAt",
                                payoutRequest.getRequestedAt());

                result.put(
                                "reviewedAt",
                                payoutRequest.getReviewedAt());

                result.put(
                                "approvedAt",
                                payoutRequest.getApprovedAt());

                result.put(
                                "paidAt",
                                payoutRequest.getPaidAt());

                result.put(
                                "rejectedAt",
                                payoutRequest.getRejectedAt());

                result.put(
                                "canceledAt",
                                payoutRequest.getCanceledAt());

                result.put(
                                "createdAt",
                                payoutRequest.getCreatedAt());

                result.put(
                                "updatedAt",
                                payoutRequest.getUpdatedAt());

                return result;
        }

        /*
         * =========================
         * ADMIN GET PAYOUT LIST
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getAdminPayoutRequests(
                        String status,
                        int current,
                        int pageSize) {

                int normalizedCurrent = Math.max(current, 1);

                int normalizedPageSize = Math.min(
                                Math.max(pageSize, 1),
                                100);

                Pageable pageable = PageRequest.of(
                                normalizedCurrent - 1,
                                normalizedPageSize);

                String normalizedStatus = normalizePayoutStatus(status);

                Page<ArtistPayoutRequest> payoutPage;

                if (normalizedStatus == null) {

                        payoutPage = artistPayoutRequestRepository
                                        .findAllByOrderByRequestedAtDesc(
                                                        pageable);

                } else {

                        payoutPage = artistPayoutRequestRepository
                                        .findByStatusOrderByRequestedAtDesc(
                                                        normalizedStatus,
                                                        pageable);
                }

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "current",
                                normalizedCurrent);

                result.put(
                                "pageSize",
                                normalizedPageSize);

                result.put(
                                "totalPages",
                                payoutPage.getTotalPages());

                result.put(
                                "totalItems",
                                payoutPage.getTotalElements());

                result.put(
                                "status",
                                normalizedStatus);

                result.put(
                                "result",
                                payoutPage
                                                .getContent()
                                                .stream()
                                                .map(this::toPayoutResponse)
                                                .toList());

                return result;
        }

        /*
         * =========================
         * ADMIN GET PAYOUT DETAIL
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getAdminPayoutRequestDetail(
                        String payoutRequestId) {

                if (payoutRequestId == null
                                || payoutRequestId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Payout request ID is required");
                }

                ArtistPayoutRequest payoutRequest = artistPayoutRequestRepository
                                .findById(
                                                payoutRequestId.trim())
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Payout request not found"));

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistId(
                                                payoutRequest.getArtistId())
                                .orElse(null);

                return buildAdminActionResult(
                                payoutRequest,
                                wallet);
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */
        private void validateCreateRequest(
                        CreateArtistPayoutRequestDTO dto) {

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Payout request data is required");
                }

                if (dto.getAmount() == null
                                || dto.getAmount() <= 0L) {

                        throw new IllegalArgumentException(
                                        "Payout amount must be greater than zero");
                }

                long normalizedMinimum = Math.max(
                                minimumPayoutAmount,
                                1L);

                long normalizedMaximum = Math.max(
                                maximumPayoutAmount,
                                normalizedMinimum);

                if (dto.getAmount() < normalizedMinimum) {

                        throw new IllegalArgumentException(
                                        "Minimum payout amount is "
                                                        + normalizedMinimum
                                                        + " VND");
                }

                if (dto.getAmount() > normalizedMaximum) {

                        throw new IllegalArgumentException(
                                        "Maximum payout amount is "
                                                        + normalizedMaximum
                                                        + " VND");
                }

                normalizeBankCode(
                                dto.getBankCode());

                normalizeRequiredText(
                                dto.getBankName(),
                                "Bank name",
                                100);

                normalizeAccountNumber(
                                dto.getAccountNumber());

                normalizeAccountHolderName(
                                dto.getAccountHolderName());

                normalizeOptionalText(
                                dto.getArtistNote(),
                                500);
        }

        private String normalizePayoutStatus(
                        String status) {

                if (status == null
                                || status.isBlank()) {

                        return null;
                }

                String normalizedStatus = status
                                .trim()
                                .toUpperCase(
                                                Locale.ROOT);

                return switch (normalizedStatus) {

                        case ArtistPayoutRequest.STATUS_PENDING,
                                        ArtistPayoutRequest.STATUS_APPROVED,
                                        ArtistPayoutRequest.STATUS_PAID,
                                        ArtistPayoutRequest.STATUS_REJECTED,
                                        ArtistPayoutRequest.STATUS_CANCELED ->
                                normalizedStatus;

                        default -> throw new IllegalArgumentException(
                                        "Invalid payout status");
                };
        }

        private String normalizeBankCode(
                        String value) {

                String normalized = normalizeRequiredText(
                                value,
                                "Bank code",
                                30)
                                .toUpperCase(
                                                Locale.ROOT);

                if (!normalized.matches(
                                "^[A-Z0-9_-]{2,30}$")) {

                        throw new IllegalArgumentException(
                                        "Invalid bank code");
                }

                return normalized;
        }

        private String normalizeAccountNumber(
                        String value) {

                String normalized = normalizeRequiredText(
                                value,
                                "Account number",
                                50)
                                .replaceAll(
                                                "\\s+",
                                                "");

                if (!normalized.matches(
                                "^[0-9]{6,30}$")) {

                        throw new IllegalArgumentException(
                                        "Invalid bank account number");
                }

                return normalized;
        }

        private String normalizeAccountHolderName(
                        String value) {

                String normalized = normalizeRequiredText(
                                value,
                                "Account holder name",
                                150);

                return normalized
                                .replaceAll(
                                                "\\s+",
                                                " ")
                                .toUpperCase(
                                                Locale.ROOT);
        }

        private String normalizeRequiredText(
                        String value,
                        String fieldName,
                        int maximumLength) {

                if (value == null
                                || value.isBlank()) {

                        throw new IllegalArgumentException(
                                        fieldName + " is required");
                }

                String normalized = value.trim();

                if (normalized.length() > maximumLength) {

                        throw new IllegalArgumentException(
                                        fieldName
                                                        + " must not exceed "
                                                        + maximumLength
                                                        + " characters");
                }

                return normalized;
        }

        private String normalizeOptionalText(
                        String value,
                        int maximumLength) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                String normalized = value.trim();

                if (normalized.length() > maximumLength) {

                        throw new IllegalArgumentException(
                                        "Note must not exceed "
                                                        + maximumLength
                                                        + " characters");
                }

                return normalized;
        }

        private void validateArtistId(
                        String artistId) {

                if (artistId == null
                                || artistId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Artist ID is required");
                }
        }

        private long safeMoney(
                        Long value) {

                return value == null
                                ? 0L
                                : Math.max(
                                                value,
                                                0L);
        }

        private void validateAdminAction(
                        String adminId,
                        String payoutRequestId) {

                if (adminId == null
                                || adminId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Admin ID is required");
                }

                if (payoutRequestId == null
                                || payoutRequestId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Payout request ID is required");
                }
        }

        private String normalizeTransactionReference(
                        String value) {

                return normalizeRequiredText(
                                value,
                                "Transaction reference",
                                100);
        }

        /*
         * =========================
         * ADMIN REJECT PAYOUT
         * =========================
         */
        @Transactional
        public Map<String, Object> rejectPayoutRequest(
                        String adminId,
                        String payoutRequestId,
                        AdminArtistPayoutActionDTO dto) {

                validateAdminAction(
                                adminId,
                                payoutRequestId);

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Admin action data is required");
                }

                String rejectionReason = normalizeRequiredText(
                                dto.getAdminNote(),
                                "Rejection reason",
                                500);

                ArtistPayoutRequest payoutRequest = artistPayoutRequestRepository
                                .findByIdForUpdate(
                                                payoutRequestId.trim())
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Payout request not found"));

                boolean rejectable = ArtistPayoutRequest.STATUS_PENDING.equals(
                                payoutRequest.getStatus())
                                || ArtistPayoutRequest.STATUS_APPROVED.equals(
                                                payoutRequest.getStatus());

                if (!rejectable) {
                        throw new IllegalStateException(
                                        "Only pending or approved payout requests can be rejected");
                }

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistIdForUpdate(
                                                payoutRequest.getArtistId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist wallet not found"));

                long amount = safeMoney(
                                payoutRequest.getAmount());

                long reservedBalance = safeMoney(
                                wallet.getReservedBalance());

                long availableBalance = safeMoney(
                                wallet.getAvailableBalance());

                if (reservedBalance < amount) {
                        throw new IllegalStateException(
                                        "Reserved wallet balance is inconsistent");
                }

                /*
                 * Hoàn số tiền đang giữ về số dư khả dụng.
                 */
                wallet.setReservedBalance(
                                reservedBalance - amount);

                wallet.setAvailableBalance(
                                Math.addExact(
                                                availableBalance,
                                                amount));

                LocalDateTime now = LocalDateTime.now();

                payoutRequest.setStatus(
                                ArtistPayoutRequest.STATUS_REJECTED);

                payoutRequest.setAdminNote(
                                rejectionReason);

                payoutRequest.setReviewedBy(
                                adminId);

                payoutRequest.setReviewedAt(
                                now);

                payoutRequest.setRejectedAt(
                                now);

                ArtistWallet savedWallet = artistWalletRepository.save(
                                wallet);

                ArtistPayoutRequest savedRequest = artistPayoutRequestRepository
                                .saveAndFlush(
                                                payoutRequest);

                return buildAdminActionResult(
                                savedRequest,
                                savedWallet);
        }

        /*
         * =========================
         * ADMIN MARK PAYOUT AS PAID
         * =========================
         */
        @Transactional
        public Map<String, Object> markPayoutAsPaid(
                        String adminId,
                        String payoutRequestId,
                        AdminArtistPayoutActionDTO dto) {

                validateAdminAction(
                                adminId,
                                payoutRequestId);

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Admin action data is required");
                }

                String transactionReference = normalizeTransactionReference(
                                dto.getTransactionReference());

                String adminNote = normalizeOptionalText(
                                dto.getAdminNote(),
                                500);

                ArtistPayoutRequest payoutRequest = artistPayoutRequestRepository
                                .findByIdForUpdate(
                                                payoutRequestId.trim())
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Payout request not found"));

                if (!ArtistPayoutRequest.STATUS_APPROVED
                                .equals(
                                                payoutRequest.getStatus())) {

                        throw new IllegalStateException(
                                        "Only approved payout requests can be marked as paid");
                }

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistIdForUpdate(
                                                payoutRequest.getArtistId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist wallet not found"));

                long amount = safeMoney(
                                payoutRequest.getAmount());

                long reservedBalance = safeMoney(
                                wallet.getReservedBalance());

                long withdrawnBalance = safeMoney(
                                wallet.getWithdrawnBalance());

                if (reservedBalance < amount) {
                        throw new IllegalStateException(
                                        "Reserved wallet balance is inconsistent");
                }

                /*
                 * Chuyển tiền đang giữ thành tiền đã rút.
                 */
                wallet.setReservedBalance(
                                reservedBalance - amount);

                wallet.setWithdrawnBalance(
                                Math.addExact(
                                                withdrawnBalance,
                                                amount));

                LocalDateTime now = LocalDateTime.now();

                payoutRequest.setStatus(
                                ArtistPayoutRequest.STATUS_PAID);

                payoutRequest.setTransactionReference(
                                transactionReference);

                payoutRequest.setAdminNote(
                                adminNote);

                payoutRequest.setReviewedBy(
                                adminId);

                payoutRequest.setReviewedAt(
                                now);

                payoutRequest.setPaidAt(
                                now);

                ArtistWallet savedWallet = artistWalletRepository.save(
                                wallet);

                ArtistPayoutRequest savedRequest = artistPayoutRequestRepository
                                .saveAndFlush(
                                                payoutRequest);

                return buildAdminActionResult(
                                savedRequest,
                                savedWallet);
        }
}