from behave import *
import requests
from hamcrest import assert_that, equal_to

from main import app

@when('i call GET {route}')
def step_impl(context, route):
    route = f"http://127.0.0.1:5000{route}"
    context.response = requests.get(url=route)

@then('i should get this response: {response}')
def step_impl(context, response):
    assert_that(context.response.text, equal_to(response))