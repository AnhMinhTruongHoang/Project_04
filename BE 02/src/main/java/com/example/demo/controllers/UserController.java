package com.example.demo.controllers;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.mindrot.jbcrypt.BCrypt;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.AuthHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;

@RestController
@RequestMapping({ "/api/users", "/api/v1/users" })
public class UserController {

	@Autowired
	private ModelMapper modelMapper;

	@Autowired
	private UserRepository userRepository;

	private boolean isAdminRequest(String authorization) {
		try {
			if (authorization == null || !authorization.startsWith("Bearer ")) {
				return false;
			}

			String token = authorization.replace("Bearer ", "");
			return AuthHelper.isAdmin(token);
		} catch (Exception e) {
			return false;
		}
	}

	private UserDTO toDTO(User user) {
		return modelMapper.map(user, UserDTO.class);
	}

	private List<UserDTO> toDTOList(List<User> users) {
		return modelMapper.map(users, new TypeToken<List<UserDTO>>() {
		}.getType());
	}

	private String getString(Map<String, Object> body, String... keys) {
		if (body == null) return null;

		for (String key : keys) {
			Object value = body.get(key);

			if (value != null) {
				String result = String.valueOf(value).trim();
				if (!result.isEmpty()) return result;
			}
		}

		return null;
	}

	private Integer getInteger(Map<String, Object> body, String key) {
		if (body == null) return null;

		Object value = body.get(key);

		if (value == null) return null;

		try {
			return Integer.parseInt(String.valueOf(value));
		} catch (Exception e) {
			return null;
		}
	}

	private Boolean getBoolean(Map<String, Object> body, String key) {
		if (body == null) return null;

		Object value = body.get(key);

		if (value == null) return null;

		if (value instanceof Boolean) {
			return (Boolean) value;
		}

		return Boolean.parseBoolean(String.valueOf(value));
	}

	private Sort getSort(String sort) {
		if (sort == null || sort.trim().isEmpty()) {
			return Sort.by(Sort.Direction.DESC, "createdAt");
		}

		if (sort.startsWith("-")) {
			return Sort.by(Sort.Direction.DESC, sort.substring(1));
		}

		return Sort.by(Sort.Direction.ASC, sort);
	}

	private void applyUserFields(User user, Map<String, Object> body) {
		String email = getString(body, "email");
		String username = getString(body, "username");
		String name = getString(body, "name", "fullName");
		String password = getString(body, "password");
		String role = getString(body, "role");
		String address = getString(body, "address");
		String gender = getString(body, "gender");
		String type = getString(body, "type");
		String avatarUrl = getString(body, "avatarUrl", "avatar", "image");
		Integer age = getInteger(body, "age");
		Boolean isVerify = getBoolean(body, "isVerify");

		if (email != null) user.setEmail(email);
		if (username != null) user.setUsername(username);
		if (name != null) user.setName(name);
		if (role != null) user.setRole(role);
		if (address != null) user.setAddress(address);
		if (gender != null) user.setGender(gender);
		if (type != null) user.setType(type);
		if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
		if (age != null) user.setAge(age);
		if (isVerify != null) user.setIsVerify(isVerify);

		if (password != null) {
			user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
		}
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
			int safePageSize = Math.max(pageSize, 1);

			Page<User> page = userRepository.findAll(
					PageRequest.of(safeCurrent - 1, safePageSize, getSort(sort)));

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

			User check = userRepository.findByEmail(email);

			if (check != null) {
				return new ResponseEntity<>(
						new ApiResponse<>(400, "Email already exists", null),
						HttpStatus.BAD_REQUEST);
			}

			User user = new User();

			user.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
			user.setEmail(email);
			user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
			user.setName(name != null ? name : email);
			user.setUsername(getString(body, "username"));
			user.setRole(getString(body, "role") != null ? getString(body, "role") : "USER");
			user.setAddress(getString(body, "address"));
			user.setAge(getInteger(body, "age"));
			user.setGender(getString(body, "gender"));
			user.setType(getString(body, "type") != null ? getString(body, "type") : "SYSTEM");
			user.setAvatarUrl(getString(body, "avatarUrl", "avatar", "image"));
			user.setCreatedAt(new Date());
			user.setUpdatedAt(new Date());

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(201, "Create user success", toDTO(user)),
					HttpStatus.CREATED);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(500, e.getMessage(), null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping({ "/{id}", "/search/{id}" })
	public ResponseEntity<?> findById(@PathVariable String id) {

		try {
			User user = userRepository.findById(id).orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(404, "User not found", null),
						HttpStatus.NOT_FOUND);
			}

			return new ResponseEntity<>(
					new ApiResponse<>(200, "Fetch user by id", toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(500, e.getMessage(), null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@RequestMapping(value = { "", "/update/{id}" }, method = { RequestMethod.PATCH, RequestMethod.PUT })
	public ResponseEntity<?> update(
			@PathVariable(required = false) String id,
			@RequestBody Map<String, Object> body,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(403, "Access denied", null),
						HttpStatus.FORBIDDEN);
			}

			String userId = id != null ? id : getString(body, "id", "_id");

			if (userId == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(400, "User id is required", null),
						HttpStatus.BAD_REQUEST);
			}

			User user = userRepository.findById(userId).orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(404, "User not found", null),
						HttpStatus.NOT_FOUND);
			}

			String newEmail = getString(body, "email");

			if (newEmail != null && !newEmail.equals(user.getEmail())) {
				User checkEmail = userRepository.findByEmail(newEmail);

				if (checkEmail != null) {
					return new ResponseEntity<>(
							new ApiResponse<>(400, "Email already exists", null),
							HttpStatus.BAD_REQUEST);
				}
			}

			applyUserFields(user, body);
			user.setUpdatedAt(new Date());

			userRepository.save(user);

			return new ResponseEntity<>(
					new ApiResponse<>(200, "Update user success", toDTO(user)),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(500, e.getMessage(), null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping({ "/{id}", "/delete/{id}" })
	public ResponseEntity<?> delete(
			@PathVariable String id,
			@RequestHeader(value = "Authorization", required = false) String authorization) {

		try {
			if (!isAdminRequest(authorization)) {
				return new ResponseEntity<>(
						new ApiResponse<>(403, "Access denied", null),
						HttpStatus.FORBIDDEN);
			}

			User user = userRepository.findById(id).orElse(null);

			if (user == null) {
				return new ResponseEntity<>(
						new ApiResponse<>(404, "User not found", null),
						HttpStatus.NOT_FOUND);
			}

			user.getLikedTracks().clear();
			userRepository.save(user);
			userRepository.delete(user);

			return new ResponseEntity<>(
					new ApiResponse<>(200, "Delete user success", null),
					HttpStatus.OK);

		} catch (Exception e) {
			return new ResponseEntity<>(
					new ApiResponse<>(500, e.getMessage(), null),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}