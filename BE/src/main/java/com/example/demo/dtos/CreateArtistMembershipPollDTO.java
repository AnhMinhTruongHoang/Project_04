package com.example.demo.dtos;

import java.util.List;

public class CreateArtistMembershipPollDTO {

    private String visibility;

    private String requiredPlanId;

    private String question;

    private List<String> options;

    private Boolean allowComments;

    private String status;

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(
            String visibility) {

        this.visibility = visibility;
    }

    public String getRequiredPlanId() {
        return requiredPlanId;
    }

    public void setRequiredPlanId(
            String requiredPlanId) {

        this.requiredPlanId = requiredPlanId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(
            String question) {

        this.question = question;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(
            List<String> options) {

        this.options = options;
    }

    public Boolean getAllowComments() {
        return allowComments;
    }

    public void setAllowComments(
            Boolean allowComments) {

        this.allowComments = allowComments;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {

        this.status = status;
    }
}