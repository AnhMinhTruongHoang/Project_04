package com.example.demo.controllers;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.mindrot.jbcrypt.BCrypt;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.User;
import com.example.demo.entities.UserFollow;
import com.example.demo.helpers.AuthHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserFollowRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping({ "/api/users", "/api/v1/users" })
public class UserController {

	private static final int MAX_PAGE_SIZE = 100;

	private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
			"createdAt",
			"updatedAt",
			"name",
			"email",
			"followers",
			"following");

	@Autowired
	private ModelMapper modelMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private UserFollowRepository userFollowRepository;

	private boolean isAdminRequest(String authorization) {
		try {
			if (authorization == null || !authorization.startsWith("Bearer ")) {
				return false;
			}

			String token = authorization.substring(7).trim();

			if (token.isEmpty()) {
				return false;
			}

			return AuthHelper.isAdmin(token);

		} catch (Exception e) {
			return false;
		}
	}

	private User getCurrentUser(String authorization) {
		try {
			if (authorization == null || !authorization.startsWith("Bearer ")) {
				return null;
			}

			String token = authorization.substring(7).trim();

			if (token.isEmpty()) {
				return null;
			}

			Claims claims = JwtHelper.verifyToken(token);
			String email = claims.getSubject();

			if (email == null || email.isBlank()) {
				return null;
			}

			return userRepository.findByEmail(email);

		} catch (Exception e) {
			return null;
		}
	}

	private UserDTO toDTO(User user) {
		return user == null ? null : modelMapper.map(user, UserDTO.class);
	}

	private List<UserDTO> toDTOList(List<User> users) {
		if (users == null || users.isEmpty()) {
			return new ArrayList<>();
		}

		return modelMapper.map(
				users,
				new TypeToken<List<UserDTO>>() {
				}.getType());
	}

	private String getString(Map<String, Object> body, String... keys) {
		if (body == null) {
			return null;
		}

		for (String key : keys) {
			Object value = body.get(key);

			if (value != null) {
				String result = String.valueOf(value).trim();

				if (!result.isEmpty()) {
					return result;
				}
			}
		}

		return null;
	}

	private Integer getInteger(Map<String, Object> body, String key) {
		if (body == null) {
			return null;
		}

		Object value = body.get(key);

		if (value == null) {
			return null;
		}

		try {
			return Integer.parseInt(String.valueOf(value));

		} catch (NumberFormatException e) {
			return null;
		}
	}

	private Boolean getBoolean(Map<String, Object> body, String key) {
		if (body == null) {
			return null;
		}

		Object value = body.get(key);

		if (value == null) {
			return null;
		}

		if (value instanceof Boolean booleanValue) {
			return booleanValue;
		}

		String stringValue = String.valueOf(value).trim();

		if ("true".equalsIgnoreCase(stringValue)) {
			return true;
		}

		if ("false".equalsIgnoreCase(stringValue)) {
			return false;
		}

		return null;
	}

	private Sort getSort(String sort) {
		if (sort == null || sort.isBlank()) {
			return Sort.by(Sort.Direction.DESC, "createdAt");
		}

		String cleanSort = sort.trim();
		Sort.Direction direction = Sort.Direction.ASC;

		if (cleanSort.startsWith("-")) {
			direction = Sort.Direction.DESC;
			cleanSort = cleanSort.substring(1);
		}

		if (!ALLOWED_SORT_FIELDS.contains(cleanSort)) {
			cleanSort = "createdAt";
			direction = Sort.Direction.DESC;
		}

		return Sort.by(direction, cleanSort);
	}

	private void applyUserFields(User user, Map<String, Object> body) {
		String email = getString(body, "email");
		String username = getString(body, "username");
		String name = getString(body, "name", "fullName");
		String password = getString(body, "password");
		String role = getString(body, "role");
		String gender = getString(body, "gender");
		String type = getString(body, "type");
		String avatarUrl = getString(body, "avatarUrl", "avatar", "image");
		String coverUrl = getString(body, "coverUrl");
		String bio = getString(body, "bio");
		String website = getString(body, "website");
		String city = getString(body, "city");
		String country = getString(body, "country");
		String spotlightTrackId = getString(body, "spotlightTrackId");
		String subscriptionTier = getString(body, "subscriptionTier");

		Boolean verified = getBoolean(body, "verified");
		Boolean isVerify = getBoolean(body, "isVerify");
		Integer age = getInteger(body, "age");

		if (email != null) {
			user.setEmail(email);
		}

		if (username != null) {
			user.setUsername(username);
		}

		if (name != null) {
			user.setName(name);
		}

		if (role != null) {
			user.setRole(role.toUpperCase());
		}

		if (gender != null) {
			user.setGender(gender.toUpperCase());
		}

		if (type != null) {
			user.setType(type.toUpperCase());
		}

		if (avatarUrl != null) {
			user.setAvatarUrl(avatarUrl);
		}

		if (coverUrl != null) {
			user.setCoverUrl(coverUrl);
		}

		if (bio != null) {
			user.setBio(bio);
		}

		if (website != null) {
			user.setWebsite(website);
		}

		if (city != null) {
			user.setCity(city);
		}

		if (country != null) {
			user.setCountry(country);
		}

		if (spotlightTrackId != null) {
			user.setSpotlightTrackId(spotlightTrackId);
		}

		if (subscriptionTier != null) {
			user.setSubscriptionTier(subscriptionTier.toUpperCase());
		}

		if (verified != null) {
			user.setVerified(verified);
		}

		if (isVerify != null) {
			user.setIsVerify(isVerify);
		}

		if (age != null) {
			user.setAge(age);
		}

		if (password != null) {
			user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
		}
	}

	private int safeCount(long value) {
		if (value <= 0) {
			return 0;
		}

		return value > Integer.MAX_VALUE
				? Integer.MAX_VALUE
				: (int) value;
	}

	private void refreshFollowCounters(User follower, User following) {
		if (follower != null) {
			follower.setFollowing(
					safeCount(userFollowRepository.countByFollower_Id(follower.getId())));
			follower.setUpdatedAt(new Date());
			userRepository.save(follower);
		}

		if (following != null) {
			following.setFollowers(
					safeCount(userFollowRepository.countByFollowing_Id(following.getId())));
			following.setUpdatedAt(new Date());
			userRepository.save(following);
		}
	}

	private void refreshUserCountersById(String userId) {
		User user = userRepository.findById(userId).orElse(null);

		if (user == null) {
			return;
		}

		user.setFollowers(
				safeCount(userFollowRepository.countByFollowing_Id(userId)));

		user.setFollowing(
				safeCount(userFollowRepository.countByFollower_Id(userId)));

		user.setUpdatedAt(new Date());

		userRepository.save(user);
	}

	private Map<String, Object> buildUserListResponse(List<User> users) {
		Map<String, Object> data = new LinkedHashMap<>();

		data.put("result", toDTOList(users));
		data.put("total", users == null ? 0 : users.size());

		return data;
	}

	private Map<String, Object> buildFollowResponse(
			User currentUser,
			User targetUser,
			boolean isFollowing) {

		Map<String, Object> data = new LinkedHashMap<>();

		data.put("isFollowing", isFollowing);
		data.put("user", toDTO(targetUser));

		data.put(
				"currentUserFollowing",
				currentUser == null
						? 0
						: safeNumber(currentUser.getFollowing()));

		data.put(
				"targetFollowers",
				targetUser == null
						? 0
						: safeNumber(targetUser.getFollowers()));

		return data;
	}

	private int safeNumber(Integer value) {
		return value == null ? 0 : value;
	}

	@GetMapping({ "/all", "/find-all" })
	public ResponseEntity<?> findAll(
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(403, "Access denied", null),
						HttpStatus.FORBIDDEN);
			}

			List<UserDTO> users = toDTOList(userRepository.findAll());

			Map<String, Object> data = new LinkedHashMap<>();

			data.put("result", users);
			data.put("total", users.size());

			return new ResponseEntity<>(
					new ApiResponse<>(200, "Fetch all users", data),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(500, e.getMessage(), null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping
	public ResponseEntity<?> paginate(
			@RequestParam(defaultValue = "1") int current,
			@RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(required = false) String sort,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(403, "Access denied", null),
						HttpStatus.FORBIDDEN);
			}

			int safeCurrent = Math.max(current, 1);

			int safePageSize = Math.min(
					Math.max(pageSize, 1),
					MAX_PAGE_SIZE);

			Page<User> page = userRepository.findAll(
					PageRequest.of(
							safeCurrent - 1,
							safePageSize,
							getSort(sort)));

			List<UserDTO> users = toDTOList(page.getContent());

			Map<String, Object> meta = new LinkedHashMap<>();

			meta.put("current", safeCurrent);
			meta.put("pageSize", safePageSize);
			meta.put("pages", page.getTotalPages());
			meta.put("total", page.getTotalElements());

			Map<String, Object> data = new LinkedHashMap<>();

			data.put("meta", meta);
			data.put("result", users);

			return new ResponseEntity<>(
					new ApiResponse<>(200, "Fetch users with paginate", data),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(500, e.getMessage(), null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping({ "", "/create" })
	public ResponseEntity<?> create(
			@RequestBody Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(403, "Access denied", null),
						HttpStatus.FORBIDDEN);
			}

			String email = getString(body, "email");
			String password = getString(body, "password");
			String name = getString(body, "name", "fullName");

			if (email == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(400, "Email is required", null),
						HttpStatus.BAD_REQUEST);
			}

			if (password == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(400, "Password is required", null),
						HttpStatus.BAD_REQUEST);
			}

			User existingUser = userRepository.findByEmail(email);

			if (existingUser != null) {
				return new ResponseEntity<>(
						new ApiResponse<>(400, "Email already exists", null),
						HttpStatus.BAD_REQUEST);
			}

			User user = new User();

			user.setId(
					UUID.randomUUID()
							.toString()
							.replace("-", "")
							.substring(0, 24));

			user.setEmail(email);

			user.setUsername(
					getString(body, "username") != null
							? getString(body, "username")
							: email);

			user.setPassword(
					BCrypt.hashpw(
							password,
							BCrypt.gensalt()));

			user.setName(
					name != null
							? name
							: email);

			user.setRole(
					getString(body, "role") != null
							? getString(body, "role").toUpperCase()
							: "USER");

			user.setAge(
					getInteger(body, "age"));

			user.setGender(
					getString(body, "gender") != null
							? getString(body, "gender").toUpperCase()
							: null);

			user.setType(
					getString(body, "type") != null
							? getString(body, "type").toUpperCase()
							: "SYSTEM");

			user.setAvatarUrl(
					getString(
							body,
							"avatarUrl",
							"avatar",
							"image"));

			user.setCoverUrl(
					getString(body, "coverUrl"));

			user.setBio(
					getString(body, "bio"));

			user.setWebsite(
					getString(body, "website"));

			user.setCity(
					getString(body, "city"));

			user.setCountry(
					getString(body, "country"));

			user.setVerified(
					getBoolean(body, "verified") != null
							? getBoolean(body, "verified")
							: false);

			user.setIsVerify(
					getBoolean(body, "isVerify") != null
							? getBoolean(body, "isVerify")
							: false);

			user.setSubscriptionTier(
					getString(body, "subscriptionTier") != null
							? getString(body, "subscriptionTier").toUpperCase()
							: "FREE");
			user.setFollowers(0);
			user.setFollowing(0);
			user.setCode("");
			user.setRefreshToken("");

			/*
			 * =========================
			 * DEFAULT ACCOUNT STATUS
			 * =========================
			 */
			user.setAccountStatus("ACTIVE");
			user.setStatusReason(null);
			user.setSuspendedUntil(null);
			user.setStatusUpdatedAt(null);

			/*
			 * =========================
			 * DEFAULT CHAT STATUS
			 * =========================
			 */
			user.setChatStatus("ACTIVE");
			user.setChatBanReason(null);
			user.setChatStatusUpdatedAt(null);

			user.setCreatedAt(new Date());
			user.setUpdatedAt(new Date());

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							201,
							"Create user success",
							toDTO(user)),
					HttpStatus.CREATED);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							e.getMessage(),
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping({ "/{id}", "/search/{id}" })
	public ResponseEntity<?> findById(
			@PathVariable String id) {

		try {
			User user = userRepository
					.findById(id)
					.orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"User not found",
								null),
						HttpStatus.NOT_FOUND);
			}

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"Fetch user by id",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							e.getMessage(),
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping("/me/following")
	public ResponseEntity<?> getMyFollowing(
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			User currentUser = getCurrentUser(authorization);

			if (currentUser == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Unauthorized",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			List<UserFollow> follows = userFollowRepository
					.findByFollower_IdOrderByCreatedAtDesc(
							currentUser.getId(),
							Pageable.unpaged())
					.getContent();

			List<User> users = new ArrayList<>();

			for (UserFollow follow : follows) {
				if (follow.getFollowing() != null) {
					users.add(
							follow.getFollowing());
				}
			}

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"Fetch my following users",
							buildUserListResponse(users)),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							e.getMessage(),
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping("/me/followers")
	public ResponseEntity<?> getMyFollowers(
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			User currentUser = getCurrentUser(authorization);

			if (currentUser == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Unauthorized",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			List<UserFollow> follows = userFollowRepository
					.findByFollowing_IdOrderByCreatedAtDesc(
							currentUser.getId(),
							Pageable.unpaged())
					.getContent();

			List<User> users = new ArrayList<>();

			for (UserFollow follow : follows) {
				if (follow.getFollower() != null) {
					users.add(
							follow.getFollower());
				}
			}

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"Fetch my followers",
							buildUserListResponse(users)),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							e.getMessage(),
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@RequestMapping(value = { "", "/update/{id}" }, method = {
			RequestMethod.PATCH,
			RequestMethod.PUT
	})
	public ResponseEntity<?> update(
			@PathVariable(required = false) String id,
			@RequestBody Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"Access denied",
								null),
						HttpStatus.FORBIDDEN);
			}

			String userId = id != null
					? id
					: getString(
							body,
							"id",
							"_id");

			if (userId == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"User id is required",
								null),
						HttpStatus.BAD_REQUEST);
			}

			User user = userRepository
					.findById(userId)
					.orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"User not found",
								null),
						HttpStatus.NOT_FOUND);
			}

			String newEmail = getString(
					body,
					"email");

			if (newEmail != null
					&& !newEmail.equalsIgnoreCase(
							user.getEmail())) {

				User checkEmail = userRepository.findByEmail(
						newEmail);

				if (checkEmail != null) {
					return new ResponseEntity<>(
							new ApiResponse<>(
									400,
									"Email already exists",
									null),
							HttpStatus.BAD_REQUEST);
				}
			}

			applyUserFields(
					user,
					body);

			user.setUpdatedAt(
					new Date());

			userRepository.save(
					user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"Update user success",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							e.getMessage(),
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private void applyMyProfileFields(
			User user,
			Map<String, Object> body) {

		String name = getString(
				body,
				"name",
				"fullName");

		String gender = getString(
				body,
				"gender");

		String avatarUrl = getString(
				body,
				"avatarUrl",
				"avatar",
				"image");

		String coverUrl = getString(
				body,
				"coverUrl");

		String bio = getString(
				body,
				"bio");

		String website = getString(
				body,
				"website");

		String city = getString(
				body,
				"city");

		String country = getString(
				body,
				"country");

		String spotlightTrackId = getString(
				body,
				"spotlightTrackId");

		Integer age = getInteger(
				body,
				"age");

		if (name != null) {
			user.setName(name);
		}

		if (gender != null) {
			user.setGender(
					gender.toUpperCase());
		}

		if (avatarUrl != null) {
			user.setAvatarUrl(
					avatarUrl);
		}

		if (coverUrl != null) {
			user.setCoverUrl(
					coverUrl);
		}

		if (bio != null) {
			user.setBio(bio);
		}

		if (website != null) {
			user.setWebsite(
					website);
		}

		if (city != null) {
			user.setCity(city);
		}

		if (country != null) {
			user.setCountry(
					country);
		}

		if (spotlightTrackId != null) {
			user.setSpotlightTrackId(
					spotlightTrackId);
		}

		if (age != null
				&& age >= 1
				&& age <= 120) {

			user.setAge(age);
		}
	}

	/*
	 * =========================
	 * UPDATE MY PROFILE
	 * =========================
	 */
	@PatchMapping("/me")
	public ResponseEntity<?> updateMyProfile(
			@RequestBody Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			User currentUser = getCurrentUser(authorization);

			if (currentUser == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Unauthorized",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			String accountStatus = currentUser.getAccountStatus() == null
					? "ACTIVE"
					: currentUser
							.getAccountStatus()
							.trim()
							.toUpperCase();

			if (!"ACTIVE".equals(accountStatus)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"Your account is not allowed to update its profile.",
								null),
						HttpStatus.FORBIDDEN);
			}

			applyMyProfileFields(
					currentUser,
					body);

			currentUser.setUpdatedAt(
					new Date());

			userRepository.save(
					currentUser);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"Profile updated successfully",
							toDTO(currentUser)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to update profile due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// delete
	@Transactional
	@DeleteMapping({ "/{id}", "/delete/{id}" })
	public ResponseEntity<?> delete(
			@PathVariable String id,
			@RequestBody(required = false) Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"You do not have permission to manage user accounts.",
								null),
						HttpStatus.FORBIDDEN);
			}

			User currentAdmin = getCurrentUser(authorization);

			if (currentAdmin == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Your administrator session is invalid or has expired.",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			User user = userRepository
					.findById(id)
					.orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"The requested user account was not found.",
								null),
						HttpStatus.NOT_FOUND);
			}

			if (currentAdmin.getId().equals(user.getId())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"You cannot deactivate your own administrator account.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			if ("ADMIN".equalsIgnoreCase(user.getRole())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"Administrator accounts cannot be deactivated from this action.",
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("DELETED".equalsIgnoreCase(user.getAccountStatus())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								200,
								"This user account has already been deactivated.",
								toDTO(user)),
						HttpStatus.OK);
			}

			String reason = getString(body, "reason");

			if (reason == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Account restriction reason is required.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			if (reason.length() > 500) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Account restriction reason cannot exceed 500 characters.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			Date now = new Date();

			user.setAccountStatus("DELETED");
			user.setStatusReason(reason);
			user.setSuspendedUntil(null);
			user.setStatusUpdatedAt(now);
			user.setRefreshToken(null);
			user.setUpdatedAt(now);

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"User account deactivated successfully. Tracks, playlists, comments and other account data have been preserved.",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to deactivate this user account due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	///
	/*
	 * =========================
	 * SUSPEND USER FOR 7 DAYS
	 * =========================
	 */
	@Transactional
	@PatchMapping("/{id}/suspend")
	public ResponseEntity<?> suspendUser(
			@PathVariable String id,
			@RequestBody(required = false) Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"You do not have permission to suspend user accounts.",
								null),
						HttpStatus.FORBIDDEN);
			}

			User currentAdmin = getCurrentUser(authorization);

			if (currentAdmin == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Your administrator session is invalid or has expired.",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			User user = userRepository.findById(id).orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"The requested user account was not found.",
								null),
						HttpStatus.NOT_FOUND);
			}

			if (currentAdmin.getId().equals(user.getId())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"You cannot suspend your own administrator account.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			if ("ADMIN".equalsIgnoreCase(user.getRole())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"Administrator accounts cannot be suspended from this action.",
								null),
						HttpStatus.FORBIDDEN);
			}

			String currentStatus = user.getAccountStatus();

			if ("DELETED".equalsIgnoreCase(currentStatus)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								409,
								"This account has already been deactivated and cannot be suspended.",
								null),
						HttpStatus.CONFLICT);
			}

			Date now = new Date();

			if ("SUSPENDED".equalsIgnoreCase(currentStatus)
					&& user.getSuspendedUntil() != null
					&& user.getSuspendedUntil().after(now)) {

				return new ResponseEntity<>(
						new ApiResponse<>(
								409,
								"This account is already suspended until "
										+ user.getSuspendedUntil()
										+ ".",
								toDTO(user)),
						HttpStatus.CONFLICT);
			}

			String reason = getString(body, "reason");

			if (reason == null) {
				reason = "Temporary suspension issued by an administrator.";
			}

			Date suspendedUntil = Date.from(
					Instant.now().plus(7, ChronoUnit.DAYS));

			user.setAccountStatus("SUSPENDED");
			user.setStatusReason(reason);
			user.setSuspendedUntil(suspendedUntil);
			user.setStatusUpdatedAt(now);
			user.setRefreshToken(null);
			user.setUpdatedAt(now);

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"User account suspended for 7 days. The account will be automatically reactivated after the suspension expires.",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to suspend this user account due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/*
	 * =========================
	 * REACTIVATE USER
	 * =========================
	 */
	@Transactional
	@PatchMapping("/{id}/activate")
	public ResponseEntity<?> activateUser(
			@PathVariable String id,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"You do not have permission to reactivate user accounts.",
								null),
						HttpStatus.FORBIDDEN);
			}

			User user = userRepository.findById(id).orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"The requested user account was not found.",
								null),
						HttpStatus.NOT_FOUND);
			}

			String currentStatus = user.getAccountStatus();

			if ("ACTIVE".equalsIgnoreCase(currentStatus)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								200,
								"This user account is already active.",
								toDTO(user)),
						HttpStatus.OK);
			}

			Date now = new Date();

			user.setAccountStatus("ACTIVE");
			user.setStatusReason(null);
			user.setSuspendedUntil(null);
			user.setStatusUpdatedAt(now);
			user.setRefreshToken(null);
			user.setUpdatedAt(now);

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"User account reactivated successfully. The user can now sign in again.",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to reactivate this user account due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/*
	 * =========================
	 * BAN USER CHAT
	 * =========================
	 */
	@Transactional
	@PatchMapping("/{id}/ban-chat")
	public ResponseEntity<?> banUserChat(
			@PathVariable String id,
			@RequestBody(required = false) Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"You do not have permission to manage chat access.",
								null),
						HttpStatus.FORBIDDEN);
			}

			User currentAdmin = getCurrentUser(authorization);

			if (currentAdmin == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Your administrator session is invalid or has expired.",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			User user = userRepository
					.findById(id)
					.orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"The requested user account was not found.",
								null),
						HttpStatus.NOT_FOUND);
			}

			if (currentAdmin.getId().equals(user.getId())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"You cannot disable your own chat access.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			if ("ADMIN".equalsIgnoreCase(user.getRole())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"Administrator chat access cannot be disabled.",
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("BANNED".equalsIgnoreCase(user.getChatStatus())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								200,
								"This user's chat access is already disabled.",
								toDTO(user)),
						HttpStatus.OK);
			}

			String reason = getString(body, "reason");

			if (reason == null) {
				reason = "Chat access disabled by an administrator.";
			}

			Date now = new Date();

			user.setChatStatus("BANNED");
			user.setChatBanReason(reason);
			user.setChatStatusUpdatedAt(now);
			user.setUpdatedAt(now);

			/*
			 * Không xóa refresh token.
			 * User vẫn được đăng nhập, nghe nhạc và sử dụng tài khoản.
			 * Chỉ bị chặn comment/chat.
			 */
			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"User chat access disabled successfully. The restriction will remain until an administrator enables chat again.",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to disable this user's chat access due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/*
	 * =========================
	 * ENABLE USER CHAT
	 * =========================
	 */
	@Transactional
	@PatchMapping("/{id}/enable-chat")
	public ResponseEntity<?> enableUserChat(
			@PathVariable String id,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"You do not have permission to manage chat access.",
								null),
						HttpStatus.FORBIDDEN);
			}

			User currentAdmin = getCurrentUser(authorization);

			if (currentAdmin == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								401,
								"Your administrator session is invalid or has expired.",
								null),
						HttpStatus.UNAUTHORIZED);
			}

			User user = userRepository
					.findById(id)
					.orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								404,
								"The requested user account was not found.",
								null),
						HttpStatus.NOT_FOUND);
			}

			if ("ADMIN".equalsIgnoreCase(user.getRole())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"Administrator chat access cannot be modified from this action.",
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("ACTIVE".equalsIgnoreCase(user.getChatStatus())) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								200,
								"This user's chat access is already active.",
								toDTO(user)),
						HttpStatus.OK);
			}

			Date now = new Date();

			user.setChatStatus("ACTIVE");
			user.setChatBanReason(null);
			user.setChatStatusUpdatedAt(now);
			user.setUpdatedAt(now);

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"User chat access enabled successfully. The user can now post comments again.",
							toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to enable this user's chat access due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	///

	@GetMapping("/leaderboard/artists")
	public ResponseEntity<?> getArtistLeaderboard(
			@RequestParam(defaultValue = "10") int limit) {

		try {
			int safeLimit = Math.min(
					Math.max(limit, 1),
					MAX_PAGE_SIZE);

			PageRequest pageable = PageRequest.of(
					0,
					safeLimit,
					Sort.by(
							Sort.Direction.DESC,
							"followers"));

			Page<User> page = userRepository.findByType(
					"ARTIST",
					pageable);

			return new ResponseEntity<>(
					new ApiResponse<>(
							200,
							"Fetch artist leaderboard",
							toDTOList(
									page.getContent())),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							e.getMessage(),
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	//// who to follow
	@GetMapping("/who-to-follow")
	public ResponseEntity<?> getWhoToFollow(
			@RequestParam(defaultValue = "12") int limit) {

		try {
			int safeLimit = Math.min(
					Math.max(limit, 1),
					24);

			List<User> users = userRepository.findWhoToFollow(
					PageRequest.of(
							0,
							safeLimit));

			List<Map<String, Object>> result = users
					.stream()
					.map(user -> {

						Map<String, Object> item = new LinkedHashMap<>();

						item.put(
								"id",
								user.getId());

						item.put(
								"_id",
								user.getId());

						item.put(
								"name",
								user.getName());

						item.put(
								"username",
								user.getUsername());

						item.put(
								"email",
								user.getEmail());

						item.put(
								"avatarUrl",
								user.getAvatarUrl());

						item.put(
								"followers",
								user.getFollowers() == null
										? 0
										: user.getFollowers());

						item.put(
								"following",
								user.getFollowing() == null
										? 0
										: user.getFollowing());

						item.put(
								"verified",
								Boolean.TRUE.equals(
										user.getVerified()));

						item.put(
								"isVerify",
								Boolean.TRUE.equals(
										user.getIsVerify()));

						item.put(
								"type",
								user.getType());

						item.put(
								"role",
								user.getRole());

						return item;
					})
					.collect(
							Collectors.toList());

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Fetch who to follow success",
							result));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.status(500)
					.body(
							new ApiResponse<>(
									500,
									e.getMessage(),
									null));
		}
	}

	///
}