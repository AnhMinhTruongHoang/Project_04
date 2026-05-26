package com.example.demo.helpers;

import io.jsonwebtoken.Claims;

public class AuthHelper {

	public static boolean isAdmin(String token) {

		Claims claims = JwtHelper.verifyToken(token);

		String role = claims.get("role", String.class);

		return role.equals("ADMIN");
	}
}