package com.example.demo.dtos;

public class UserDTO {

	private String id;
	private String email;
	private String username;
	private String name;
	private String role;
	private String address;
	private Integer age;
	private String gender;
	private Boolean isVerify;
	private String type;

	public UserDTO() {
	}

	public UserDTO(String id, String email, String username, String name, String role, String address, Integer age,
			String gender, Boolean isVerify, String type) {
		this.id = id;
		this.email = email;
		this.username = username;
		this.name = name;
		this.role = role;
		this.address = address;
		this.age = age;
		this.gender = gender;
		this.isVerify = isVerify;
		this.type = type;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public Integer getAge() {
		return age;
	}

	public void setAge(Integer age) {
		this.age = age;
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
	}

	public Boolean getIsVerify() {
		return isVerify;
	}

	public void setIsVerify(Boolean isVerify) {
		this.isVerify = isVerify;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

}