package com.example.demo.services;

import java.util.List;

import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.User;

public interface UserService {

	User findByEmail(String email);

	User save(User user);

	List<UserDTO> findAll();

}