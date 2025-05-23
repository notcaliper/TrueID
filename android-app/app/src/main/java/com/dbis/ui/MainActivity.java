package com.dbis.ui;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.dbis.R;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize your components here
        initializeComponents();
    }
    
    private void initializeComponents() {
        // TODO: Initialize UI components, set up listeners, etc.
    }
}
