Feature: showing off behave

  Scenario: Test liveness returns correct response when calling the endpoint
      When i call GET /liveness
      Then i should get this response: We are live baby!