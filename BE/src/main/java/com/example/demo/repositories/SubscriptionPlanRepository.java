package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.SubscriptionPlan;

public interface SubscriptionPlanRepository
        extends JpaRepository<SubscriptionPlan, String> {

    SubscriptionPlan findByCode(
            String code);

    SubscriptionPlan findByCodeAndIsActiveTrue(
            String code);

    List<SubscriptionPlan> findByIsActiveTrueOrderByMonthlyPriceAsc();
}