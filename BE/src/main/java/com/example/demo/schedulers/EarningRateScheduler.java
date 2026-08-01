package com.example.demo.schedulers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.demo.services.EarningRateService;

@Component
public class EarningRateScheduler {

    private static final Logger logger = LoggerFactory.getLogger(
            EarningRateScheduler.class);

    private final EarningRateService earningRateService;

    public EarningRateScheduler(
            EarningRateService earningRateService) {

        this.earningRateService = earningRateService;
    }

    /*
     * Kiểm tra các earning rate SCHEDULED
     * đã đến thời điểm áp dụng.
     *
     * Mặc định chạy mỗi 60 giây.
     */
    @Scheduled(fixedDelayString = "${artist.earning.rate-scheduler-delay-ms:60000}")
    public void activateScheduledRates() {

        try {

            earningRateService
                    .activateScheduledRates();

        } catch (Exception exception) {

            logger.error(
                    "Failed to activate scheduled earning rates.",
                    exception);
        }
    }
}