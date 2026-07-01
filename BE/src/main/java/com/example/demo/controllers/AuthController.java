package com.example.demo.controllers;

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
		dto.setAddress(user.getAddress());
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
		playlist.setCreatedAt(new Date());
		playlist.setUpdatedAt(new Date());

		playlistRepository.save(playlist);
	}

	@PostMapping("login")
	public ResponseEntity<?> login(@RequestBody LoginDTO dto) {
		try {
			User user = userService.findByEmail(dto.getEmail());

			if (user == null || user.getPassword() == null || !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Login Failed", null), HttpStatus.BAD_REQUEST);
			}

			String accessToken = JwtHelper.generateToken(user.getEmail(), user.getRole());
			String refreshToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			user.setRefreshToken(refreshToken);
			user.setUpdatedAt(new Date());

			userService.save(user);

			LoginResponseDTO loginResponse = buildLoginResponse(user, accessToken, refreshToken);

			return new ResponseEntity<>(new ApiResponse<>(201, "Login success", loginResponse), HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/// register
	@PostMapping("register")
	public ResponseEntity<?> register(@RequestBody RegisterDTO dto) {
		try {
			User checkUser = userService.findByEmail(dto.getEmail());

			if (checkUser != null) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Email already exists", null),
						HttpStatus.BAD_REQUEST);
			}

			String otp = generateOtp();

			User user = new User();

			user.setId(generateId());
			user.setEmail(dto.getEmail());
			user.setPassword(BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt()));
			user.setName(dto.getName());
			user.setAge(dto.getAge());
			user.setGender(dto.getGender());
			user.setAddress(dto.getAddress());
			user.setUsername("");
			user.setRole("USER");
			user.setType("SYSTEM");
			user.setIsVerify(false);
			user.setCode(otp);
			user.setRefreshToken("");
			user.setFollowers(0);
			user.setFollowing(0);
			user.setCreatedAt(new Date());
			user.setUpdatedAt(new Date());

			userService.save(user);
			createDefaultPlaylist(user);

			emailService.sendOtpEmail(
					user.getEmail(),
					"Verify your SoundClone account",
					otp,
					5);

			return new ResponseEntity<>(
					new ApiResponse<>(201, "Register success. Please check your email for OTP.",
							toUserResponseDTO(user)),
					HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
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

			if (user == null) {
				return new ResponseEntity<>(new ApiResponse<>(404, "User Not Found", null), HttpStatus.NOT_FOUND);
			}

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

	@PostMapping("social-media")
	public ResponseEntity<?> socialMedia(@RequestBody(required = false) Map<String, Object> body) {
		try {
			String type = body != null && body.get("type") != null ? body.get("type").toString() : null;
			String username = body != null && body.get("username") != null ? body.get("username").toString() : null;
			String email = body != null && body.get("email") != null ? body.get("email").toString() : null;
			String name = body != null && body.get("name") != null ? body.get("name").toString() : null;
			String avatarUrl = body != null && body.get("avatarUrl") != null ? body.get("avatarUrl").toString() : null;

			String loginEmail = email != null && !email.trim().isEmpty() ? email : username;

			if (loginEmail == null || loginEmail.trim().isEmpty()) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Missing email", null), HttpStatus.BAD_REQUEST);
			}

			User user = userRepository.findByEmail(loginEmail);

			if (user == null) {
				user = new User();

				user.setId(generateId());
				user.setEmail(loginEmail);
				user.setUsername(loginEmail);
				user.setName(name != null && !name.trim().isEmpty() ? name : loginEmail);
				user.setRole("USER");
				user.setType(type != null ? type.toUpperCase() : "SOCIAL");
				user.setIsVerify(true);
				user.setPassword("");
				user.setCode("");
				user.setRefreshToken("");
				user.setAvatarUrl(avatarUrl);
				user.setFollowers(0);
				user.setFollowing(0);
				user.setCreatedAt(new Date());
				user.setUpdatedAt(new Date());

				userRepository.save(user);
				createDefaultPlaylist(user);
			} else {
				if (name != null && !name.trim().isEmpty()) {
					user.setName(name);
				}

				if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
					user.setAvatarUrl(avatarUrl);
				}

				user.setType(type != null ? type.toUpperCase() : user.getType());
				user.setUpdatedAt(new Date());
			}

			String accessToken = JwtHelper.generateToken(user.getEmail(), user.getRole());
			String refreshToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			user.setRefreshToken(refreshToken);
			userRepository.save(user);

			LoginResponseDTO loginResponse = buildLoginResponse(user, accessToken, refreshToken);

			return new ResponseEntity<>(
					new ApiResponse<>(201, "Fetch tokens for user login with social media account", loginResponse),
					HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}