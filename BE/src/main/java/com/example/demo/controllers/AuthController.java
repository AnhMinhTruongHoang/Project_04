package com.example.demo.controllers;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.dtos.ForgotPasswordDTO;
import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.LoginResponseDTO;
import com.example.demo.dtos.RegisterDTO;
import com.example.demo.dtos.ResetPasswordDTO;
import com.example.demo.dtos.UserResponseDTO;
import com.example.demo.dtos.VerifyOtpDTO;
import com.example.demo.entities.Playlist;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.PlaylistRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.EmailService;
import com.example.demo.services.UserService;
import io.jsonwebtoken.Claims;

@RestController
@RequestMapping({ "/api/auth", "/api/v1/auth" })
public class AuthController {

	@Autowired
	private UserService userService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PlaylistRepository playlistRepository;

	@Autowired
	private EmailService emailService;

	private String generateId() {
		return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
	}

	private String getBearerToken(String authorization) {
		if (authorization == null || authorization.trim().isEmpty()) {
			return null;
		}

		return authorization.replace("Bearer ", "").trim();
	}

	private String generateOtp() {
		return String.valueOf((int) (Math.random() * 900000) + 100000);
	}

	private UserResponseDTO toUserResponseDTO(User user) {
		UserResponseDTO dto = new UserResponseDTO();

		dto.setId(user.getId());
		dto.setUsername(user.getUsername());
		dto.setEmail(user.getEmail());
		dto.setIsVerify(user.getIsVerify());
		dto.setType(user.getType());
		dto.setName(user.getName());
		dto.setRole(user.getRole());
		dto.setGender(user.getGender());
		dto.setAge(user.getAge());
		dto.setAvatarUrl(user.getAvatarUrl());
		dto.setFollowers(user.getFollowers() == null ? 0 : user.getFollowers());
		dto.setFollowing(user.getFollowing() == null ? 0 : user.getFollowing());
		dto.setCreatedAt(user.getCreatedAt());
		dto.setUpdatedAt(user.getUpdatedAt());

		return dto;
	}

	private LoginResponseDTO buildLoginResponse(User user, String accessToken, String refreshToken) {
		LoginResponseDTO loginResponse = new LoginResponseDTO();

		loginResponse.setAccess_token(accessToken);
		loginResponse.setRefresh_token(refreshToken);
		loginResponse.setUser(toUserResponseDTO(user));

		return loginResponse;
	}

	private void createDefaultPlaylist(User user) {
		Playlist playlist = new Playlist();

		playlist.setId(generateId());
		playlist.setTitle("My Playlist");
		playlist.setIsPublic(false);
		playlist.setUserId(user.getId());
		playlist.setIsAlbum(false);
		playlist.setIsDeleted(false);
		playlist.setTracks(new HashSet<>());
		playlist.setCreatedAt(LocalDateTime.now());
		playlist.setUpdatedAt(LocalDateTime.now());
		playlistRepository.save(playlist);
	}

	/// stop duplicate email registration
	private String normalizeAccountType(String type) {
		if (type == null || type.isBlank()) {
			return "SYSTEM";
		}

		return type.trim().toUpperCase();
	}

	private String getProviderName(String type) {
		String normalizedType = normalizeAccountType(type);

		return switch (normalizedType) {
			case "GOOGLE" -> "Google";
			case "GITHUB" -> "GitHub";
			case "SYSTEM" -> "email and password";
			default -> normalizedType;
		};
	}

	private ResponseEntity<?> validateAccountStatus(User user) {
		String accountStatus = user.getAccountStatus();

		if ("DELETED".equalsIgnoreCase(accountStatus)) {
			return new ResponseEntity<>(
					new ApiResponse<>(
							403,
							"This account has been deactivated by an administrator.",
							null),
					HttpStatus.FORBIDDEN);
		}

		if ("BANNED".equalsIgnoreCase(accountStatus)) {
			String reason = user.getStatusReason();

			return new ResponseEntity<>(
					new ApiResponse<>(
							403,
							reason == null || reason.isBlank()
									? "This account has been banned by an administrator."
									: "This account has been banned. Reason: " + reason,
							null),
					HttpStatus.FORBIDDEN);
		}

		if ("SUSPENDED".equalsIgnoreCase(accountStatus)) {
			Date suspendedUntil = user.getSuspendedUntil();

			if (suspendedUntil == null || suspendedUntil.after(new Date())) {
				String reason = user.getStatusReason();

				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								reason == null || reason.isBlank()
										? "This account is temporarily suspended."
										: "This account is temporarily suspended. Reason: " + reason,
								null),
						HttpStatus.FORBIDDEN);
			}

			Date now = new Date();

			user.setAccountStatus("ACTIVE");
			user.setStatusReason(null);
			user.setSuspendedUntil(null);
			user.setStatusUpdatedAt(now);
			user.setUpdatedAt(now);

			userService.save(user);
		}

		return null;
	}

	///
	@PostMapping("login")
	public ResponseEntity<?> login(@RequestBody LoginDTO dto) {
		try {
			String email = dto.getEmail() == null
					? null
					: dto.getEmail().trim().toLowerCase();

			if (email == null || email.isBlank()) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Email is required.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			User user = userService.findByEmail(email);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Email or password is incorrect.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			/* ACCOUNT STATUS */
			String accountStatus = user.getAccountStatus() == null
					? "ACTIVE"
					: user.getAccountStatus().trim().toUpperCase();

			if ("DELETED".equals(accountStatus)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"This account has been deactivated by an administrator.",
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("BANNED".equals(accountStatus)) {
				String reason = user.getStatusReason();

				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								reason == null || reason.isBlank()
										? "This account has been banned by an administrator."
										: "This account has been banned. Reason: " + reason,
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("SUSPENDED".equals(accountStatus)) {
				Date suspendedUntil = user.getSuspendedUntil();

				if (suspendedUntil == null || suspendedUntil.after(new Date())) {
					String reason = user.getStatusReason();

					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									reason == null || reason.isBlank()
											? "This account is temporarily suspended."
											: "This account is temporarily suspended. Reason: " + reason,
									null),
							HttpStatus.FORBIDDEN);
				}

				Date now = new Date();

				user.setAccountStatus("ACTIVE");
				user.setStatusReason(null);
				user.setSuspendedUntil(null);
				user.setStatusUpdatedAt(now);
				user.setUpdatedAt(now);

				userService.save(user);
			}

			/* LOGIN PROVIDER */
			String accountType = user.getType() == null || user.getType().isBlank()
					? "SYSTEM"
					: user.getType().trim().toUpperCase();

			if (!"SYSTEM".equals(accountType)) {
				String providerName = switch (accountType) {
					case "GOOGLE" -> "Google";
					case "GITHUB" -> "GitHub";
					default -> accountType;
				};

				return new ResponseEntity<>(
						new ApiResponse<>(
								409,
								"This email is registered with "
										+ providerName
										+ ". Please continue with "
										+ providerName
										+ ".",
								null),
						HttpStatus.CONFLICT);
			}

			if (user.getPassword() == null
					|| !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {

				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Email or password is incorrect.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			String accessToken = JwtHelper.generateToken(
					user.getEmail(),
					user.getRole());

			String refreshToken = JwtHelper.generateToken(
					user.getEmail(),
					user.getRole());

			user.setRefreshToken(refreshToken);
			user.setUpdatedAt(new Date());

			userService.save(user);

			LoginResponseDTO loginResponse = buildLoginResponse(
					user,
					accessToken,
					refreshToken);

			return new ResponseEntity<>(
					new ApiResponse<>(
							201,
							"Login success",
							loginResponse),
					HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to sign in due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// REGISTER
	@PostMapping("register")
	public ResponseEntity<?> register(@RequestBody RegisterDTO dto) {
		try {
			String email = dto.getEmail() == null
					? null
					: dto.getEmail().trim().toLowerCase();

			if (email == null || email.isBlank()) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Email is required.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			if (dto.getPassword() == null || dto.getPassword().isBlank()) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Password is required.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			User checkUser = userService.findByEmail(email);

			if (checkUser != null) {
				String accountStatus = checkUser.getAccountStatus() == null
						? "ACTIVE"
						: checkUser.getAccountStatus().trim().toUpperCase();

				if ("DELETED".equals(accountStatus)) {
					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									"This email belongs to an account that has been deactivated by an administrator.",
									null),
							HttpStatus.FORBIDDEN);
				}

				if ("BANNED".equals(accountStatus)) {
					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									"This email belongs to an account that has been banned.",
									null),
							HttpStatus.FORBIDDEN);
				}

				if ("SUSPENDED".equals(accountStatus)) {
					Date suspendedUntil = checkUser.getSuspendedUntil();

					if (suspendedUntil == null || suspendedUntil.after(new Date())) {
						return new ResponseEntity<>(
								new ApiResponse<>(
										403,
										"This email belongs to an account that is temporarily suspended.",
										null),
								HttpStatus.FORBIDDEN);
					}
				}

				String existingType = checkUser.getType() == null
						|| checkUser.getType().isBlank()
								? "SYSTEM"
								: checkUser.getType().trim().toUpperCase();

				if (!"SYSTEM".equals(existingType)) {
					String providerName = switch (existingType) {
						case "GOOGLE" -> "Google";
						case "GITHUB" -> "GitHub";
						default -> existingType;
					};

					return new ResponseEntity<>(
							new ApiResponse<>(
									409,
									"This email is already registered with "
											+ providerName
											+ ". Please continue with "
											+ providerName
											+ ".",
									null),
							HttpStatus.CONFLICT);
				}

				if (Boolean.TRUE.equals(checkUser.getIsVerify())) {
					return new ResponseEntity<>(
							new ApiResponse<>(
									409,
									"This email is already registered. Please sign in or reset your password.",
									null),
							HttpStatus.CONFLICT);
				}

				return new ResponseEntity<>(
						new ApiResponse<>(
								409,
								"This email is already registered but has not been verified. Please verify your OTP or request a new OTP.",
								null),
						HttpStatus.CONFLICT);
			}

			String otp = generateOtp();
			Date now = new Date();

			User user = new User();

			user.setId(generateId());
			user.setEmail(email);
			user.setPassword(
					BCrypt.hashpw(
							dto.getPassword(),
							BCrypt.gensalt()));

			user.setName(dto.getName());
			user.setAge(dto.getAge());
			user.setGender(dto.getGender());
			user.setUsername(email);
			user.setRole("USER");
			user.setType("SYSTEM");
			user.setIsVerify(false);
			user.setVerified(false);
			user.setCode(otp);
			user.setRefreshToken("");
			user.setFollowers(0);
			user.setFollowing(0);

			user.setAccountStatus("ACTIVE");
			user.setStatusReason(null);
			user.setSuspendedUntil(null);
			user.setStatusUpdatedAt(now);

			user.setCreatedAt(now);
			user.setUpdatedAt(now);

			userService.save(user);
			createDefaultPlaylist(user);

			emailService.sendOtpEmail(
					user.getEmail(),
					"Verify your SoundClone account",
					otp,
					5);

			return new ResponseEntity<>(
					new ApiResponse<>(
							201,
							"Registration successful. Please check your email for the verification code.",
							toUserResponseDTO(user)),
					HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to register this account due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// OTP
	@PostMapping("verify-otp")
	public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpDTO dto) {
		try {
			User user = userService.findByEmail(dto.getEmail());

			if (user == null) {
				return new ResponseEntity<>(new ApiResponse<>(404, "User not found", null), HttpStatus.NOT_FOUND);
			}

			if (user.getIsVerify() != null && user.getIsVerify()) {
				return new ResponseEntity<>(new ApiResponse<>(200, "Account already verified", toUserResponseDTO(user)),
						HttpStatus.OK);
			}

			if (user.getCode() == null || !user.getCode().equals(dto.getOtp())) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Invalid OTP", null), HttpStatus.BAD_REQUEST);
			}

			user.setIsVerify(true);
			user.setCode("");
			user.setUpdatedAt(new Date());

			userService.save(user);

			return new ResponseEntity<>(new ApiResponse<>(200, "Verify OTP success", toUserResponseDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// re-send otp
	@PostMapping("resend-otp")
	public ResponseEntity<?> resendOtp(@RequestBody ForgotPasswordDTO dto) {
		try {
			User user = userService.findByEmail(dto.getEmail());

			if (user == null) {
				return new ResponseEntity<>(new ApiResponse<>(404, "User not found", null), HttpStatus.NOT_FOUND);
			}

			if (user.getIsVerify() != null && user.getIsVerify()) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Account already verified", null),
						HttpStatus.BAD_REQUEST);
			}

			String otp = generateOtp();

			user.setCode(otp);
			user.setUpdatedAt(new Date());

			userService.save(user);

			emailService.sendOtpEmail(
					user.getEmail(),
					"Verify your SoundClone account",
					otp,
					5);

			return new ResponseEntity<>(new ApiResponse<>(200, "Resend OTP success", null), HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// forgot-password
	@PostMapping("forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordDTO dto) {
		try {
			User user = userService.findByEmail(dto.getEmail());

			if (user == null) {
				return new ResponseEntity<>(new ApiResponse<>(404, "User not found", null), HttpStatus.NOT_FOUND);
			}

			String otp = generateOtp();

			user.setCode(otp);
			user.setUpdatedAt(new Date());

			userService.save(user);

			emailService.sendOtpEmail(
					user.getEmail(),
					"Reset your SoundClone password",
					otp,
					5);

			return new ResponseEntity<>(new ApiResponse<>(200, "OTP has been sent to your email", null), HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// reset password
	@PostMapping("reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDTO dto) {
		try {
			User user = userService.findByEmail(dto.getEmail());

			if (user == null) {
				return new ResponseEntity<>(new ApiResponse<>(404, "User not found", null), HttpStatus.NOT_FOUND);
			}

			if (user.getCode() == null || !user.getCode().equals(dto.getOtp())) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Invalid OTP", null), HttpStatus.BAD_REQUEST);
			}

			user.setPassword(BCrypt.hashpw(dto.getNewPassword(), BCrypt.gensalt()));
			user.setCode("");
			user.setUpdatedAt(new Date());

			userService.save(user);

			return new ResponseEntity<>(new ApiResponse<>(200, "Reset password success", null), HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	///

	@GetMapping("account")
	public ResponseEntity<?> account(@RequestHeader(value = "Authorization", required = false) String authorization) {
		try {
			String token = getBearerToken(authorization);

			if (token == null) {
				return new ResponseEntity<>(new ApiResponse<>(401, "Missing token", null), HttpStatus.UNAUTHORIZED);
			}

			Claims claims = JwtHelper.verifyToken(token);
			String email = claims.getSubject();

			User user = userService.findByEmail(email);

			//// stop if user is banned or deleted
			String accountStatus = user.getAccountStatus();

			if ("DELETED".equalsIgnoreCase(accountStatus)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"This account has been deactivated by an administrator.",
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("BANNED".equalsIgnoreCase(accountStatus)) {
				String reason = user.getStatusReason();

				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								reason == null || reason.isBlank()
										? "This account has been banned by an administrator."
										: "This account has been banned. Reason: " + reason,
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("SUSPENDED".equalsIgnoreCase(accountStatus)) {
				Date suspendedUntil = user.getSuspendedUntil();

				if (suspendedUntil == null || suspendedUntil.after(new Date())) {
					String reason = user.getStatusReason();

					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									reason == null || reason.isBlank()
											? "This account is temporarily suspended."
											: "This account is temporarily suspended. Reason: " + reason,
									null),
							HttpStatus.FORBIDDEN);
				}

				user.setAccountStatus("ACTIVE");
				user.setStatusReason(null);
				user.setSuspendedUntil(null);
				user.setStatusUpdatedAt(new Date());
				user.setUpdatedAt(new Date());

				userService.save(user);
			}
			///

			Map<String, Object> data = new LinkedHashMap<>();
			data.put("user", toUserResponseDTO(user));

			return new ResponseEntity<>(new ApiResponse<>(200, "Fetch account", data), HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(401, "Invalid token", null), HttpStatus.UNAUTHORIZED);
		}
	}

	@PostMapping("refresh")
	public ResponseEntity<?> refresh(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody(required = false) Map<String, Object> body) {
		try {
			String refreshToken = null;

			if (body != null) {
				Object tokenFromBody = body.get("refresh_token");

				if (tokenFromBody == null) {
					tokenFromBody = body.get("refreshToken");
				}

				if (tokenFromBody != null) {
					refreshToken = tokenFromBody.toString();
				}
			}

			if (refreshToken == null) {
				refreshToken = getBearerToken(authorization);
			}

			if (refreshToken == null) {
				return new ResponseEntity<>(new ApiResponse<>(401, "Missing refresh token", null),
						HttpStatus.UNAUTHORIZED);
			}

			Claims claims = JwtHelper.verifyToken(refreshToken);
			String email = claims.getSubject();

			User user = userService.findByEmail(email);
			String accountStatus = user.getAccountStatus();

			if ("DELETED".equalsIgnoreCase(accountStatus)) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								"This account has been deactivated by an administrator.",
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("BANNED".equalsIgnoreCase(accountStatus)) {
				String reason = user.getStatusReason();

				return new ResponseEntity<>(
						new ApiResponse<>(
								403,
								reason == null || reason.isBlank()
										? "This account has been banned by an administrator."
										: "This account has been banned. Reason: " + reason,
								null),
						HttpStatus.FORBIDDEN);
			}

			if ("SUSPENDED".equalsIgnoreCase(accountStatus)) {
				Date suspendedUntil = user.getSuspendedUntil();

				if (suspendedUntil == null || suspendedUntil.after(new Date())) {
					String reason = user.getStatusReason();

					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									reason == null || reason.isBlank()
											? "This account is temporarily suspended."
											: "This account is temporarily suspended. Reason: " + reason,
									null),
							HttpStatus.FORBIDDEN);
				}

				user.setAccountStatus("ACTIVE");
				user.setStatusReason(null);
				user.setSuspendedUntil(null);
				user.setStatusUpdatedAt(new Date());
				user.setUpdatedAt(new Date());

				userService.save(user);
			}

			if (user == null) {
				return new ResponseEntity<>(new ApiResponse<>(404, "User Not Found", null), HttpStatus.NOT_FOUND);
			}

			if (user.getRefreshToken() != null && !user.getRefreshToken().isEmpty()
					&& !user.getRefreshToken().equals(refreshToken)) {
				return new ResponseEntity<>(new ApiResponse<>(401, "Invalid refresh token", null),
						HttpStatus.UNAUTHORIZED);
			}

			String newAccessToken = JwtHelper.generateToken(user.getEmail(), user.getRole());
			String newRefreshToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			user.setRefreshToken(newRefreshToken);
			user.setUpdatedAt(new Date());

			userService.save(user);

			LoginResponseDTO loginResponse = buildLoginResponse(user, newAccessToken, newRefreshToken);

			return new ResponseEntity<>(new ApiResponse<>(200, "Refresh token success", loginResponse), HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(401, "Invalid refresh token", null), HttpStatus.UNAUTHORIZED);
		}
	}

	@PostMapping("logout")
	public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
		try {
			String token = getBearerToken(authorization);

			if (token == null) {
				return new ResponseEntity<>(new ApiResponse<>(200, "Logout Success", null), HttpStatus.OK);
			}

			Claims claims = JwtHelper.verifyToken(token);
			String email = claims.getSubject();

			User user = userService.findByEmail(email);

			if (user != null) {
				user.setRefreshToken(null);
				user.setUpdatedAt(new Date());
				userService.save(user);
			}

			return new ResponseEntity<>(new ApiResponse<>(200, "Logout Success", null), HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(200, "Logout Success", null), HttpStatus.OK);
		}
	}

	//// social login
	@PostMapping("social-media")
	public ResponseEntity<?> socialMedia(
			@RequestBody(required = false) Map<String, Object> body) {

		try {
			String type = body != null && body.get("type") != null
					? body.get("type").toString().trim()
					: null;

			String username = body != null && body.get("username") != null
					? body.get("username").toString().trim()
					: null;

			String email = body != null && body.get("email") != null
					? body.get("email").toString().trim()
					: null;

			String name = body != null && body.get("name") != null
					? body.get("name").toString().trim()
					: null;

			String avatarUrl = body != null && body.get("avatarUrl") != null
					? body.get("avatarUrl").toString().trim()
					: null;

			String loginEmail = email != null && !email.isBlank()
					? email.toLowerCase()
					: username != null
							? username.toLowerCase()
							: null;

			if (loginEmail == null || loginEmail.isBlank()) {
				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"Email is required for social login.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			String requestedProvider = type == null
					? ""
					: type.toUpperCase();

			if (!"GOOGLE".equals(requestedProvider)
					&& !"GITHUB".equals(requestedProvider)) {

				return new ResponseEntity<>(
						new ApiResponse<>(
								400,
								"A valid social login provider is required.",
								null),
						HttpStatus.BAD_REQUEST);
			}

			String requestedProviderName = "GOOGLE".equals(requestedProvider)
					? "Google"
					: "GitHub";

			User user = userRepository.findByEmail(loginEmail);

			if (user == null) {
				Date now = new Date();

				user = new User();

				user.setId(generateId());
				user.setEmail(loginEmail);
				user.setUsername(loginEmail);
				user.setName(
						name != null && !name.isBlank()
								? name
								: loginEmail);

				user.setRole("USER");
				user.setType(requestedProvider);
				user.setIsVerify(true);
				user.setVerified(true);
				user.setPassword("");
				user.setCode("");
				user.setRefreshToken("");
				user.setAvatarUrl(avatarUrl);
				user.setFollowers(0);
				user.setFollowing(0);

				user.setAccountStatus("ACTIVE");
				user.setStatusReason(null);
				user.setSuspendedUntil(null);
				user.setStatusUpdatedAt(now);

				user.setCreatedAt(now);
				user.setUpdatedAt(now);

				userRepository.save(user);
				createDefaultPlaylist(user);

			} else {
				/* ACCOUNT STATUS */
				String accountStatus = user.getAccountStatus() == null
						? "ACTIVE"
						: user.getAccountStatus().trim().toUpperCase();

				if ("DELETED".equals(accountStatus)) {
					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									"This account has been deactivated by an administrator.",
									null),
							HttpStatus.FORBIDDEN);
				}

				if ("BANNED".equals(accountStatus)) {
					String reason = user.getStatusReason();

					return new ResponseEntity<>(
							new ApiResponse<>(
									403,
									reason == null || reason.isBlank()
											? "This account has been banned by an administrator."
											: "This account has been banned. Reason: " + reason,
									null),
							HttpStatus.FORBIDDEN);
				}

				if ("SUSPENDED".equals(accountStatus)) {
					Date suspendedUntil = user.getSuspendedUntil();

					if (suspendedUntil == null
							|| suspendedUntil.after(new Date())) {

						String reason = user.getStatusReason();

						return new ResponseEntity<>(
								new ApiResponse<>(
										403,
										reason == null || reason.isBlank()
												? "This account is temporarily suspended."
												: "This account is temporarily suspended. Reason: "
														+ reason,
										null),
								HttpStatus.FORBIDDEN);
					}

					Date now = new Date();

					user.setAccountStatus("ACTIVE");
					user.setStatusReason(null);
					user.setSuspendedUntil(null);
					user.setStatusUpdatedAt(now);
					user.setUpdatedAt(now);
				}

				/* LOGIN PROVIDER */
				String existingType = user.getType() == null
						|| user.getType().isBlank()
								? "SYSTEM"
								: user.getType().trim().toUpperCase();

				if ("SYSTEM".equals(existingType)) {
					return new ResponseEntity<>(
							new ApiResponse<>(
									409,
									"This email is already registered with email and password. Please sign in using your password.",
									null),
							HttpStatus.CONFLICT);
				}

				/*
				 * Hỗ trợ tài khoản social cũ chưa lưu rõ GOOGLE/GITHUB.
				 * Sau lần đăng nhập hợp lệ đầu tiên sẽ chuẩn hóa provider.
				 */
				if ("SOCIAL".equals(existingType)) {
					user.setType(requestedProvider);
					existingType = requestedProvider;
				}

				if (!existingType.equals(requestedProvider)) {
					String existingProviderName;

					if ("GOOGLE".equals(existingType)) {
						existingProviderName = "Google";
					} else if ("GITHUB".equals(existingType)) {
						existingProviderName = "GitHub";
					} else {
						existingProviderName = existingType;
					}

					return new ResponseEntity<>(
							new ApiResponse<>(
									409,
									"This email is already registered with "
											+ existingProviderName
											+ ". Please continue with "
											+ existingProviderName
											+ ".",
									null),
							HttpStatus.CONFLICT);
				}

				if (name != null && !name.isBlank()) {
					user.setName(name);
				}

				if (avatarUrl != null && !avatarUrl.isBlank()) {
					user.setAvatarUrl(avatarUrl);
				}

				user.setIsVerify(true);
				user.setVerified(true);
				user.setUpdatedAt(new Date());

				userRepository.save(user);
			}

			String accessToken = JwtHelper.generateToken(
					user.getEmail(),
					user.getRole());

			String refreshToken = JwtHelper.generateToken(
					user.getEmail(),
					user.getRole());

			user.setRefreshToken(refreshToken);
			user.setUpdatedAt(new Date());

			userRepository.save(user);

			LoginResponseDTO loginResponse = buildLoginResponse(
					user,
					accessToken,
					refreshToken);

			return new ResponseEntity<>(
					new ApiResponse<>(
							201,
							"Login with " + requestedProviderName + " successful.",
							loginResponse),
					HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();

			return new ResponseEntity<>(
					new ApiResponse<>(
							500,
							"Unable to complete social login due to an internal server error.",
							null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	///
}