package com.example.demo.controllers;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.mindrot.jbcrypt.BCrypt;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.CreateUserDTO;
import com.example.demo.dtos.UpdateUserDTO;
import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.AuthHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.responses.PaginationResponse;
import com.example.demo.responses.UserPaginationResponse;
import com.example.demo.services.UserService;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("api/users")
public class UserController {

	@Autowired
	private UserService userService;

	@Autowired
	private ModelMapper modelMapper;

	@Autowired
	private UserRepository userRepository;

	@GetMapping("find-all")
	public ResponseEntity<?> findAll(@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			// check admin
			if (!AuthHelper.isAdmin(token)) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								403,

								"Access denied",

								null),

						HttpStatus.FORBIDDEN);
			}

			List<UserDTO> users = modelMapper.map(

					userRepository.findAll(),

					new TypeToken<List<UserDTO>>() {
					}.getType());

			return new ResponseEntity<>(

					new ApiResponse<>(

							200,

							"Fetch all user without paginate",

							new Object() {

								public List<UserDTO> result = users;
							}),

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

	@GetMapping
	public ResponseEntity<?> paginate(

			@RequestParam(defaultValue = "1") int current,

			@RequestParam(defaultValue = "10") int pageSize,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			// check admin
			if (!AuthHelper.isAdmin(token)) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								403,

								"Access denied",

								null),

						HttpStatus.FORBIDDEN);
			}

			Page<User> page =

					userRepository.findAll(

							PageRequest.of(current - 1, pageSize));

			List<UserDTO> users = modelMapper.map(

					page.getContent(),

					new TypeToken<List<UserDTO>>() {
					}.getType());

			PaginationResponse meta = new PaginationResponse(

					current,

					pageSize,

					page.getTotalPages(),

					page.getTotalElements());

			UserPaginationResponse response = new UserPaginationResponse(meta, users);

			return new ResponseEntity<>(

					new ApiResponse<>(

							200,

							"Fetch user with paginate",

							response),

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

	// Tạo user mới
	@PostMapping("create")
	public ResponseEntity<?> create(

			@RequestBody CreateUserDTO dto,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			// check admin
			if (!AuthHelper.isAdmin(token)) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								403,

								"Access denied",

								null),

						HttpStatus.FORBIDDEN);
			}

			User check = userRepository.findByEmail(dto.getEmail());

			if (check != null) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								400,

								"Email already exists",

								null),

						HttpStatus.BAD_REQUEST);
			}

			User user = new User();

			user.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));

			user.setEmail(dto.getEmail());

			user.setPassword(BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt()));

			user.setName(dto.getName());

			user.setRole(dto.getRole());

			user.setAddress(dto.getAddress());

			user.setAge(dto.getAge());

			user.setGender(dto.getGender());

			user.setIsVerify(true);

			user.setType("SYSTEM");

			user.setCreatedAt(new Date());

			user.setUpdatedAt(new Date());

			userRepository.save(user);

			UserDTO userDTO = modelMapper.map(user, UserDTO.class);

			return new ResponseEntity<>(

					new ApiResponse<>(

							201,

							"Create user success",

							userDTO),

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

	// Tìm kiếm user bằng id
	@GetMapping("search/{id}")
	public ResponseEntity<?> findById(

			@PathVariable String id,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			if (!AuthHelper.isAdmin(token)) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								403,

								"Access denied",

								null),

						HttpStatus.FORBIDDEN);
			}

			User user = userRepository.findById(id).orElse(null);

			if (user == null) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								404,

								"User not found",

								null),

						HttpStatus.NOT_FOUND);
			}

			UserDTO userDTO = modelMapper.map(user, UserDTO.class);

			return new ResponseEntity<>(

					new ApiResponse<>(

							200,

							"Fetch user by id",

							userDTO),

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

	// Cập nhật user
	@PutMapping("update/{id}")
	public ResponseEntity<?> update(

			@PathVariable String id,

			@RequestBody UpdateUserDTO dto,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			if (!AuthHelper.isAdmin(token)) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								403,

								"Access denied",

								null),

						HttpStatus.FORBIDDEN);
			}

			User user = userRepository.findById(id).orElse(null);

			if (user == null) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								404,

								"User not found",

								null),

						HttpStatus.NOT_FOUND);
			}

			user.setName(dto.getName());

			user.setRole(dto.getRole());

			user.setAddress(dto.getAddress());

			user.setAge(dto.getAge());

			user.setGender(dto.getGender());

			user.setUpdatedAt(new Date());

			userRepository.save(user);

			UserDTO userDTO = modelMapper.map(user, UserDTO.class);

			return new ResponseEntity<>(

					new ApiResponse<>(

							200,

							"Update user success",

							userDTO),

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

	// Xóa user
	@DeleteMapping("delete/{id}")
	public ResponseEntity<?> delete(

			@PathVariable String id,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			if (!AuthHelper.isAdmin(token)) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								403,

								"Access denied",

								null),

						HttpStatus.FORBIDDEN);
			}

			User user = userRepository.findById(id).orElse(null);

			if (user == null) {

				return new ResponseEntity<>(

						new ApiResponse<>(

								404,

								"User not found",

								null),

						HttpStatus.NOT_FOUND);
			}

			user.getLikedTracks().clear();

			userRepository.save(user);

			userRepository.delete(user);

			return new ResponseEntity<>(

					new ApiResponse<>(

							200,

							"Delete user success",

							null),

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
}