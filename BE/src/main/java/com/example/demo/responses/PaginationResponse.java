package com.example.demo.responses;

public class PaginationResponse {

	private int current;
	private int pageSize;
	private int pages;
	private long total;

	public PaginationResponse() {
	}

	public PaginationResponse(int current, int pageSize, int pages, long total) {
		this.current = current;
		this.pageSize = pageSize;
		this.pages = pages;
		this.total = total;
	}

	public int getCurrent() {
		return current;
	}

	public void setCurrent(int current) {
		this.current = current;
	}

	public int getPageSize() {
		return pageSize;
	}

	public void setPageSize(int pageSize) {
		this.pageSize = pageSize;
	}

	public int getPages() {
		return pages;
	}

	public void setPages(int pages) {
		this.pages = pages;
	}

	public long getTotal() {
		return total;
	}

	public void setTotal(long total) {
		this.total = total;
	}
}