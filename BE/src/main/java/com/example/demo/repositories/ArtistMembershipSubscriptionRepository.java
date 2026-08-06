package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistMembershipSubscription;

public interface ArtistMembershipSubscriptionRepository
    extends JpaRepository<ArtistMembershipSubscription, String> {

  /*
   * =========================
   * MEMBERSHIP BY MEMBER + ARTIST
   * =========================
   */

  Optional<ArtistMembershipSubscription> findByMemberIdAndArtistId(
      String memberId,
      String artistId);

  boolean existsByMemberIdAndArtistIdAndStatus(
      String memberId,
      String artistId,
      String status);

  /*
   * =========================
   * MEMBER MEMBERSHIP LIST
   * =========================
   */

  List<ArtistMembershipSubscription> findByMemberIdOrderByCreatedAtDesc(
      String memberId);

  /*
   * =========================
   * ARTIST MEMBER LIST
   * =========================
   */

  Page<ArtistMembershipSubscription> findByArtistIdOrderByCreatedAtDesc(
      String artistId,
      Pageable pageable);

  Page<ArtistMembershipSubscription> findByArtistIdAndStatusOrderByCreatedAtDesc(
      String artistId,
      String status,
      Pageable pageable);

  long countByArtistIdAndStatus(
      String artistId,
      String status);

  /*
   * =========================
   * OWNED SUBSCRIPTION
   * =========================
   */

  Optional<ArtistMembershipSubscription> findByIdAndMemberId(
      String id,
      String memberId);

  /*
   * =========================
   * LOCK MEMBERSHIP
   * =========================
   *
   * Một member chỉ có một subscription
   * đối với mỗi artist.
   *
   * Dùng khi:
   * - VNPay IPN kích hoạt membership;
   * - gia hạn membership;
   * - thay đổi plan;
   * - hủy membership.
   */

  @Query(value = """
      SELECT *
      FROM artist_membership_subscriptions
      WHERE memberId = :memberId
        AND artistId = :artistId
      FOR UPDATE
      """, nativeQuery = true)
  Optional<ArtistMembershipSubscription> findByMemberIdAndArtistIdForUpdate(
      @Param("memberId") String memberId,
      @Param("artistId") String artistId);

  /*
   * =========================
   * EXPIRED MEMBERSHIP BATCH
   * =========================
   */

  List<ArtistMembershipSubscription> findTop100ByStatusAndCurrentPeriodEndLessThanEqualOrderByCurrentPeriodEndAsc(
      String status,
      LocalDateTime currentPeriodEnd);

  /*
   * =========================
   * LOCK SUBSCRIPTION BY ID
   * =========================
   */
  @Query(value = """
      SELECT *
      FROM artist_membership_subscriptions
      WHERE id = :subscriptionId
      FOR UPDATE
      """, nativeQuery = true)
  Optional<ArtistMembershipSubscription> findByIdForUpdate(
      @Param("subscriptionId") String subscriptionId);
}