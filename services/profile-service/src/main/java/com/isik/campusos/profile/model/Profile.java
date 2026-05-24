package com.isik.campusos.profile.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String userId;

    private String email;
    private String firstName;
    private String lastName;
    private String department;
    private String phoneNumber;
    private String residenceAddress;
    private String bloodType;
    private String nationalIdMasked;
    
    @Column(length = 1000)
    private String bio;
    
    private String skills; // Stored as comma-separated values for simplicity
    
    private int trustScore;

    @PrePersist
    protected void onCreate() {
        this.trustScore = 100; // default starting trust score
    }
}
