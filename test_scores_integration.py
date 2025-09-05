#!/usr/bin/env python3
"""
SCORES Integration Test Script
Tests the complete SCORES module functionality and integration with the main RAG system
"""

import os
import sys
import requests
import json
import time
from pathlib import Path

def test_main_system():
    """Test main RAG system health"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Main RAG system is running")
            return True
        else:
            print("❌ Main RAG system health check failed")
            return False
    except Exception as e:
        print(f"❌ Main RAG system not accessible: {e}")
        return False

def test_scores_system():
    """Test SCORES system health"""
    try:
        response = requests.get('http://localhost:5001/api/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ SCORES system is running")
            print(f"   Database: {data.get('database', 'unknown')}")
            print(f"   RAG System: {'Available' if data.get('rag_system_available') else 'Not Available'}")
            return True
        else:
            print("❌ SCORES system health check failed")
            return False
    except Exception as e:
        print(f"❌ SCORES system not accessible: {e}")
        return False

def test_user_registration():
    """Test user registration functionality"""
    try:
        test_user = {
            "name": "Test User",
            "pan": "ABCDE1234F",
            "email": "test@example.com",
            "mobile": "9876543210",
            "dob": "01/01/1990"
        }
        
        response = requests.post(
            'http://localhost:5001/api/register',
            json=test_user,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ User registration successful")
                print(f"   User ID: {data.get('user_id')}")
                print(f"   Password: {data.get('password')}")
                return data
            else:
                print(f"❌ Registration failed: {data.get('error')}")
                return None
        else:
            print(f"❌ Registration request failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Registration test error: {e}")
        return None

def test_complaint_lodging(user_credentials):
    """Test complaint lodging functionality"""
    if not user_credentials:
        print("❌ Skipping complaint test - no user credentials")
        return None
        
    try:
        complaint_data = {
            "user_id": user_credentials['user_id'],
            "password": user_credentials['password'],
            "entity_type": "Stock Broker",
            "category": "Trading Issues",
            "description": "Test complaint for integration testing. This is a sample complaint to verify the complaint lodging functionality works correctly."
        }
        
        response = requests.post(
            'http://localhost:5001/api/lodge',
            json=complaint_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Complaint lodging successful")
                print(f"   Complaint ID: {data.get('complaint_id')}")
                return data.get('complaint_id')
            else:
                print(f"❌ Complaint lodging failed: {data.get('error')}")
                return None
        else:
            print(f"❌ Complaint lodging request failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Complaint lodging test error: {e}")
        return None

def test_complaint_tracking(user_credentials, complaint_id):
    """Test complaint tracking functionality"""
    if not user_credentials or not complaint_id:
        print("❌ Skipping tracking test - missing credentials or complaint ID")
        return False
        
    try:
        tracking_data = {
            "user_id": user_credentials['user_id'],
            "password": user_credentials['password'],
            "complaint_id": complaint_id
        }
        
        response = requests.post(
            'http://localhost:5001/api/track',
            json=tracking_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                complaint = data.get('complaint', {})
                print("✅ Complaint tracking successful")
                print(f"   Status: {complaint.get('status')}")
                print(f"   Days Elapsed: {complaint.get('days_elapsed')}")
                print(f"   Reminders: {len(complaint.get('reminders', []))}")
                return True
            else:
                print(f"❌ Complaint tracking failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Complaint tracking request failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Complaint tracking test error: {e}")
        return False

def test_rag_integration():
    """Test RAG system integration"""
    try:
        test_query = {
            "question": "What are the registration requirements for stock brokers in India?"
        }
        
        response = requests.post(
            'http://localhost:5001/api/query',
            json=test_query,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ RAG system integration successful")
                print(f"   Answer length: {len(data.get('answer', ''))}")
                print(f"   Sources: {data.get('source_count', 0)}")
                return True
            else:
                print(f"❌ RAG query failed: {data.get('error')}")
                return False
        else:
            print(f"❌ RAG query request failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ RAG integration test error: {e}")
        return False

def test_file_structure():
    """Test if all required files exist"""
    required_files = [
        "scores/app_scores.py",
        "scores/index.html",
        "scores/styles.css",
        "scores/script.js",
        "scores/README.md",
        "requirements.txt",
        "index.html"  # Main system
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"✅ Found: {file_path}")
    
    if missing_files:
        print(f"\n❌ Missing files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    print("✅ All required files present")
    return True

def test_navigation_integration():
    """Test navigation integration between systems"""
    try:
        # Test main system has SCORES link
        response = requests.get('http://localhost:5000/', timeout=5)
        if response.status_code == 200:
            content = response.text
            if 'SCORES Complaints' in content and 'scores/index.html' in content:
                print("✅ Main system has SCORES navigation")
            else:
                print("❌ Main system missing SCORES navigation")
                return False
        else:
            print("❌ Could not fetch main system page")
            return False
        
        # Test SCORES system has back link
        response = requests.get('http://localhost:5001/', timeout=5)
        if response.status_code == 200:
            content = response.text
            if '../index.html' in content:
                print("✅ SCORES system has back navigation")
            else:
                print("❌ SCORES system missing back navigation")
                return False
        else:
            print("❌ Could not fetch SCORES system page")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Navigation integration test error: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🧪 SEBI SCORES Integration Test Suite")
    print("=" * 50)
    
    test_results = {
        "File Structure": test_file_structure(),
        "Main RAG System": test_main_system(),
        "SCORES System": test_scores_system(),
        "Navigation Integration": test_navigation_integration(),
    }
    
    # Only run API tests if both systems are running
    if test_results["Main RAG System"] and test_results["SCORES System"]:
        print("\n🔧 Testing API Functionality...")
        
        # Test user registration
        user_credentials = test_user_registration()
        test_results["User Registration"] = user_credentials is not None
        
        # Test complaint lodging
        complaint_id = test_complaint_lodging(user_credentials)
        test_results["Complaint Lodging"] = complaint_id is not None
        
        # Test complaint tracking
        test_results["Complaint Tracking"] = test_complaint_tracking(user_credentials, complaint_id)
        
        # Test RAG integration
        test_results["RAG Integration"] = test_rag_integration()
    else:
        print("\n⚠️ Skipping API tests - systems not running")
        print("   Start both systems:")
        print("   - Main system: python run.py")
        print("   - SCORES system: python scores/app_scores.py")
    
    # Print summary
    print("\n📊 Test Results Summary")
    print("=" * 30)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:25} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The SCORES integration is working correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
