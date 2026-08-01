package com.example.demo.services;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.entities.EarningRate;

public interface EarningRateService {

    /*
     * Lấy tỷ giá đang có hiệu lực tại thời điểm hiện tại.
     *
     * Nếu database chưa có rate ACTIVE,
     * service implementation sẽ dùng giá trị fallback
     * trong application.properties.
     */
    EarningRate getActiveRate();

    /*
     * Lấy trực tiếp số tiền cho một qualified stream.
     *
     * Ví dụ:
     * 1 qualified stream = 20 VND
     * kết quả trả về là 20L.
     */
    Long getActiveAmountPerStream();

    /*
     * Lấy lịch sử thay đổi tỷ giá.
     */
    Page<EarningRate> getRateHistory(
            Pageable pageable);

    /*
     * Admin tạo một tỷ giá mới.
     *
     * Nếu effectiveFrom <= thời điểm hiện tại:
     * - đóng rate ACTIVE cũ
     * - rate mới trở thành ACTIVE
     *
     * Nếu effectiveFrom nằm trong tương lai:
     * - rate mới có trạng thái SCHEDULED
     * - rate hiện tại tiếp tục ACTIVE
     */
    EarningRate createRate(
            Long amountPerStream,
            String currency,
            LocalDateTime effectiveFrom,
            String reason,
            String createdBy);

    /*
     * Kích hoạt các tỷ giá SCHEDULED
     * đã đến thời điểm áp dụng.
     *
     * Method này sẽ được scheduler gọi định kỳ.
     */
    void activateScheduledRates();
}