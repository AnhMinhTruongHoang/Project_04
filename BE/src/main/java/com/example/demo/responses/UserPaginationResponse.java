package com.example.demo.responses;

import java.util.List;

import com.example.demo.dtos.UserDTO;

public class UserPaginationResponse {

	private PaginationResponse meta;
	private List<UserDTO> result;

	public UserPaginationResponse() {
	}

	public UserPaginationResponse(PaginationResponse meta, List<UserDTO> result) {
		this.meta = meta;
		this.result = result;
	}

	public PaginationResponse getMeta() {
		return meta;
	}

	public void setMeta(PaginationResponse meta) {
		this.meta = meta;
	}

	public List<UserDTO> getResult() {
		return result;
	}

	public void setResult(List<UserDTO> result) {
		this.result = result;
	}
}