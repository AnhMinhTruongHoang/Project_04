package com.example.demo.controllers;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.LoginResponseDTO;
import com.example.demo.dtos.RegisterDTO;
import com.example.demo.dtos.UserResponseDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.UserService;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping({ "/api/auth", "/api/v1/auth" })
public class AuthController {

	@Autowired
	private UserService userService;

	@Autowired
	private UserRepository userRepository;

	private String generateId() {
		return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
	}

	private String getBearerToken(String authorization) {
		if (authorization == null || authorization.trim().isEmpty()) {
			return null;
		}

		return authorization.replace("Bearer ", "").trim();
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

	@PostMapping("register")
	public ResponseEntity<?> register(@RequestBody RegisterDTO dto) {
		try {
			User checkUser = userService.findByEmail(dto.getEmail());

			if (checkUser != null) {
				return new ResponseEntity<>(new ApiResponse<>(400, "Email already exists", null),
						HttpStatus.BAD_REQUEST);
			}

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
			user.setIsVerify(true);
			user.setCode("");
			user.setRefreshToken("");
			user.setCreatedAt(new Date());
			user.setUpdatedAt(new Date());

			userService.save(user);

			return new ResponseEntity<>(new ApiResponse<>(201, "User Register Success!", toUserResponseDTO(user)),
					HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

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
	public ResponseEntity<?> socialMedia(
			@RequestParam(required = false) String type,
			@RequestParam(required = false) String username,
			@RequestParam(required = false) String email,
			@RequestParam(required = false) String name,
			@RequestParam(required = false) String avatarUrl) {
		try {
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
				user.setName(name != null ? name : loginEmail);
				user.setRole("USER");
				user.setType(type != null ? type.toUpperCase() : "SOCIAL");
				user.setIsVerify(true);
				user.setPassword("");
				user.setCode("");
				user.setRefreshToken("");
				user.setAvatarUrl(avatarUrl);
				user.setCreatedAt(new Date());
				user.setUpdatedAt(new Date());

				userRepository.save(user);
			} else {
				if (name != null) {
					user.setName(name);
				}

				if (avatarUrl != null) {
					user.setAvatarUrl(avatarUrl);
				}

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