package com.example.demo.dtos;

import java.util.List;

public class UpdatePlaylistDTO {

	private String title;
	private Boolean isPublic;
	private List<String> trackIds;

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Boolean getIsPublic() {
		return isPublic;
	}

	public void setIsPublic(Boolean isPublic) {
		this.isPublic = isPublic;
	}

	public List<String> getTrackIds() {
		return trackIds;
	}

	public void setTrackIds(List<String> trackIds) {
		this.trackIds = trackIds;
	}
}