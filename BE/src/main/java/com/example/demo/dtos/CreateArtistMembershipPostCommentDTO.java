package com.example.demo.dtos;

public class CreateArtistMembershipPostCommentDTO {

    private String content;

    /*
     * null:
     * tạo bình luận cấp cao nhất.
     *
     * Có giá trị:
     * phản hồi bình luận tương ứng.
     */
    private String parentCommentId;

    public String getContent() {
        return content;
    }

    public void setContent(
            String content) {

        this.content = content;
    }

    public String getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(
            String parentCommentId) {

        this.parentCommentId = parentCommentId;
    }
}