package com.example.demo.controllers;

import java.util.Date;
import java.util.UUID;

import org.mindrot.jbcrypt.BCrypt;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.*;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.UserService;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("api/auth")
public class AuthController {

	@Autowired
	private UserService userService;

	@Autowired
	private ModelMapper modelMapper;

	private UserRepository userRepository;

	// Login
	@PostMapping(value = "login", produces = MimeTypeUtils.APPLICATION_JSON_VALUE, consumes = MimeTypeUtils.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> login(@RequestBody LoginDTO dto) {

		try {

			User user = userService.findByEmail(dto.getEmail());

			if (user == null || !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {

				return new ResponseEntity<>(new ApiResponse<>(400, "Login Failed", null), HttpStatus.BAD_REQUEST);
			}

			String accessToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			String refreshToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			user.setRefreshToken(refreshToken);

			userService.save(user);

			UserResponseDTO userDTO = new UserResponseDTO();

			userDTO.setId(user.getId());
			userDTO.setUsername(user.getUsername());

			userDTO.setEmail(user.getEmail());

			userDTO.setAddress(user.getAddress());

			userDTO.setIsVerify(user.getIsVerify());

			userDTO.setType(user.getType());

			userDTO.setName(user.getName());

			userDTO.setRole(user.getRole());

			userDTO.setGender(user.getGender());

			userDTO.setAge(user.getAge());

			LoginResponseDTO loginResponse = new LoginResponseDTO();

			loginResponse.setAccess_token(accessToken);

			loginResponse.setRefresh_token(refreshToken);

			loginResponse.setUser(userDTO);

			ApiResponse<LoginResponseDTO> response = new ApiResponse<>(201, "Login success", loginResponse);

			return new ResponseEntity<>(response, HttpStatus.CREATED);

		} catch (Exception e) {

			e.printStackTrace();

			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Register
	@PostMapping(value = "register", produces = MimeTypeUtils.APPLICATION_JSON_VALUE, consumes = MimeTypeUtils.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> register(@RequestBody RegisterDTO dto) {

		try {

			// check email tồn tại
			User checkUser = userService.findByEmail(dto.getEmail());

			if (checkUser != null) {

				return new ResponseEntity<>(new ApiResponse<>(400, "Email already exists", null),
						HttpStatus.BAD_REQUEST);
			}

			User user = new User();

			// generate id
			user.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));

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

			UserResponseDTO userDTO = new UserResponseDTO();

			userDTO.setId(user.getId());

			userDTO.setEmail(user.getEmail());

			userDTO.setName(user.getName());

			userDTO.setAddress(user.getAddress());

			userDTO.setAge(user.getAge());

			userDTO.setGender(user.getGender());

			userDTO.setRole(user.getRole());

			userDTO.setType(user.getType());

			userDTO.setIsVerify(user.getIsVerify());

			ApiResponse<UserResponseDTO> response = new ApiResponse<>(201, "User Register Success!", userDTO);

			return new ResponseEntity<>(response, HttpStatus.CREATED);

		} catch (Exception e) {

			e.printStackTrace();

			return new ResponseEntity<>(new ApiResponse<>(500, e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Logout
	@PostMapping("logout")
	public ResponseEntity<?> logout(@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userService.findByEmail(email);

			if (user == null) {

				return new ResponseEntity<>(new ApiResponse<>(404, "User Not Found", null), HttpStatus.NOT_FOUND);
			}

			// remove refresh token
			user.setRefreshToken(null);

			userService.save(user);

			return new ResponseEntity<>(new ApiResponse<>(200, "Logout Success", null), HttpStatus.OK);

		} catch (Exception e) {

			e.printStackTrace();

			return new ResponseEntity<>(new ApiResponse<>(500, "Server Error", null), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	// Login by social media
	@PostMapping("social-media")
	public ResponseEntity<?> socialMedia(@RequestParam String type, @RequestParam String username) {

		try {

			User user = userRepository.findByEmail(username);

			if (user == null) {

				user = new User();

				user.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));

				user.setEmail(username);

				user.setUsername(username);

				user.setRole("USER");

				user.setType(type.toUpperCase());

				user.setIsVerify(true);

				userRepository.save(user);
			}

			String accessToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			String refreshToken = JwtHelper.generateToken(user.getEmail(), user.getRole());

			user.setRefreshToken(refreshToken);

			userRepository.save(user);

			UserDTO userDTO = modelMapper.map(user, UserDTO.class);

			AuthResponseDTO authResponseDTO = new AuthResponseDTO(accessToken, refreshToken, userDTO);

			return new ResponseEntity<>(

					new ApiResponse<>(

							201,

							"Fetch tokens for user login with social media account",

							authResponseDTO

					),

					HttpStatus.CREATED);

		} catch (Exception e) {

			return new ResponseEntity<>(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null

					),

					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}