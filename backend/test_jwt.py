from routers.auth import create_access_token
print(create_access_token({sub: 1, email:test@test.com}))
