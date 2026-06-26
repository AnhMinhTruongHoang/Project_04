package com.example.demo.dtos;

public class SocialLoginDTO {

	private String type;
	private String username;

	public SocialLoginDTO() {
	}

	public SocialLoginDTO(String type, String username) {
		this.type = type;
		this.username = username;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}
}